import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DocsIndex() {
  const dir = join(process.cwd(), "docs");
  const files = (await readdir(dir)).filter((f) => f.endsWith(".md")).sort();

  const docs = await Promise.all(
    files.map(async (file) => {
      const content = await readFile(join(dir, file), "utf8");
      const title = /^#\s+(.+)$/m.exec(content)?.[1] ?? file.replace(/\.md$/, "");
      const headings = (content.match(/^#{1,3}\s/gm) ?? []).length;
      const words = content.split(/\s+/).length;
      return { file, title, headings, words };
    }),
  );

  return (
    <main>
      <h1>Browse docs</h1>
      <p className="subtitle">
        {docs.length} markdown documents in the corpus — chunked, auto-embedded by Atlas, and searchable.
      </p>
      <div className="doc-grid">
        {docs.map((d) => (
          <Link href={`/docs/${d.file}`} className="doc-card" key={d.file}>
            <div className="doc-card-title">{d.title}</div>
            <div className="doc-card-file">{d.file}</div>
            <div className="doc-card-stats">
              {d.headings} sections · ~{d.words.toLocaleString()} words
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
