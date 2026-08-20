"use client";

import { useState } from "react";
import { QUERY_MODELS, INDEX_MODEL, RERANK_MODEL, type QueryModel, type SearchMode } from "@/lib/pipeline";
import { slugify } from "@/lib/slug";

interface SearchResult {
  text: string;
  sourceFile: string;
  heading: string;
  chunkIndex: number;
  score: number;
}

interface Pane {
  mode: SearchMode;
  results: SearchResult[];
  shellQuery: string;
  error?: string;
}

const PANE_TITLES: Record<SearchMode, string> = {
  semantic: "Semantic ($vectorSearch)",
  hybrid: "Hybrid ($rankFusion)",
  rerank: `Reranked ($rerank, ${RERANK_MODEL})`,
};

function CopyableQuery({ shellQuery }: { shellQuery: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(shellQuery);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className="query-panel">
      <div className="query-header">
        <span>Query (mongosh / Compass)</span>
        <button onClick={copy}>{copied ? "Copied!" : "Copy"}</button>
      </div>
      <pre>{shellQuery}</pre>
    </div>
  );
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [model, setModel] = useState<QueryModel>("voyage-4-lite");
  const [hybrid, setHybrid] = useState(false);
  const [rerank, setRerank] = useState(false);
  const [panes, setPanes] = useState<Pane[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const search = async () => {
    if (!query.trim() || loading) return;
    setLoading(true);
    setError("");
    const modes: SearchMode[] = ["semantic", ...(hybrid ? ["hybrid" as const] : []), ...(rerank ? ["rerank" as const] : [])];
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, model, modes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? res.statusText);
      setPanes(data.panes);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setPanes([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main>
      <h1>Atlas Auto-Embedding Demo</h1>
      <p className="subtitle">
        Documents auto-embedded by Atlas with <strong>{INDEX_MODEL}</strong>; queries embedded at search time with the
        model you pick below — the Voyage 4 family shares one embedding space (asymmetric retrieval).
      </p>

      <div className="controls">
        <input
          type="text"
          placeholder="Ask something about the ingested docs…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && search()}
        />
        <select value={model} onChange={(e) => setModel(e.target.value as QueryModel)}>
          {QUERY_MODELS.map((m) => (
            <option key={m} value={m}>
              query model: {m}
            </option>
          ))}
        </select>
        <label>
          <input type="checkbox" checked={hybrid} onChange={(e) => setHybrid(e.target.checked)} />
          Hybrid search
        </label>
        <label>
          <input type="checkbox" checked={rerank} onChange={(e) => setRerank(e.target.checked)} />
          Reranker
        </label>
        <button onClick={search} disabled={loading}>
          {loading ? "Searching…" : "Search"}
        </button>
      </div>

      {error && <p className="error">{error}</p>}

      <div className="panes">
        {panes.map((pane) => (
          <section className="pane" key={pane.mode}>
            <h2>{PANE_TITLES[pane.mode]}</h2>
            <p className="pane-note">
              {pane.mode === "semantic" && `Indexed with ${INDEX_MODEL}, queried with ${model}.`}
              {pane.mode === "hybrid" && "Reciprocal rank fusion of $vectorSearch (0.7) + $search full-text (0.3)."}
              {pane.mode === "rerank" && `Top 20 semantic hits reordered in-database by ${RERANK_MODEL}.`}
            </p>
            {pane.error ? (
              <p className="error">{pane.error}</p>
            ) : pane.results.length === 0 ? (
              <p className="pane-note">No results.</p>
            ) : (
              pane.results.map((r, i) => (
                <div className="result" key={i}>
                  <span className="score">
                    #{i + 1} · score {r.score.toFixed(4)}
                  </span>
                  <p className="meta">
                    <a
                      href={`/docs/${r.sourceFile}${r.heading ? `#${slugify(r.heading)}` : ""}`}
                      target="_blank"
                      title="Open source document at this section"
                    >
                      {r.sourceFile}
                      {r.heading ? ` › ${r.heading}` : ""}
                    </a>
                    {` › chunk ${r.chunkIndex}`}
                  </p>
                  <p className="text">{r.text}</p>
                </div>
              ))
            )}
            <CopyableQuery shellQuery={pane.shellQuery} />
          </section>
        ))}
      </div>
    </main>
  );
}
