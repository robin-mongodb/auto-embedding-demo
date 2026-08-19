import { NextResponse } from "next/server";
import { getChunks } from "@/lib/mongo";
import {
  buildPipeline,
  renderShellQuery,
  QUERY_MODELS,
  SEARCH_MODES,
  type QueryModel,
  type SearchMode,
} from "@/lib/pipeline";

export async function POST(request: Request) {
  const body = await request.json();
  const query = typeof body.query === "string" ? body.query.trim() : "";
  const model = body.model as QueryModel;
  const modes = Array.isArray(body.modes) ? (body.modes as SearchMode[]) : [];

  if (!query) return NextResponse.json({ error: "query is required" }, { status: 400 });
  if (!QUERY_MODELS.includes(model))
    return NextResponse.json({ error: `model must be one of ${QUERY_MODELS.join(", ")}` }, { status: 400 });
  if (modes.length === 0 || modes.some((m) => !SEARCH_MODES.includes(m)))
    return NextResponse.json({ error: `modes must be a non-empty subset of ${SEARCH_MODES.join(", ")}` }, { status: 400 });

  const chunks = getChunks();
  const panes = await Promise.all(
    modes.map(async (mode) => {
      const pipeline = buildPipeline(mode, query, model);
      try {
        const results = await chunks.aggregate(pipeline).toArray();
        return { mode, results, shellQuery: renderShellQuery(pipeline) };
      } catch (err) {
        // e.g. $rerank rejected because Native Reranking isn't enabled — show it in the pane
        const message = err instanceof Error ? err.message : String(err);
        return { mode, results: [], shellQuery: renderShellQuery(pipeline), error: message };
      }
    }),
  );

  return NextResponse.json({ panes });
}
