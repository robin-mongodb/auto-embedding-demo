/**
 * Idempotent seed: chunks docs/*.md into doc_chunks, creates the autoEmbed
 * vector index (voyage-4-large) + text search index, waits until queryable.
 * Re-run any time — unchanged files (by sha256) are skipped, so Atlas never
 * re-embeds content it already embedded.
 *
 * Run: npm run seed   (requires MONGODB_URI in .env.local)
 */
import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { getDb, getChunks, META_COLLECTION } from "../src/lib/mongo.ts";
import { chunkMarkdown } from "../src/lib/chunk.ts";
import { VECTOR_INDEX, TEXT_INDEX, INDEX_MODEL } from "../src/lib/pipeline.ts";

const DOCS_DIR = join(import.meta.dirname, "..", "docs");

async function ingest() {
  const db = getDb();
  const chunks = getChunks();
  const meta = db.collection(META_COLLECTION);

  const files = (await readdir(DOCS_DIR)).filter((f) => f.endsWith(".md"));
  if (files.length === 0) {
    console.log(`No .md files in ${DOCS_DIR} — drop some in and re-run.`);
  }

  for (const file of files) {
    const content = await readFile(join(DOCS_DIR, file), "utf8");
    const fileHash = createHash("sha256").update(content).digest("hex");

    const existing = await meta.findOne({ sourceFile: file });
    if (existing?.fileHash === fileHash) {
      console.log(`skip      ${file} (unchanged)`);
      continue;
    }

    const docs = chunkMarkdown(content).map((c) => ({ ...c, sourceFile: file }));
    await chunks.deleteMany({ sourceFile: file });
    await chunks.insertMany(docs);
    await meta.updateOne(
      { sourceFile: file },
      { $set: { fileHash } },
      { upsert: true },
    );
    console.log(`${existing ? "re-ingest" : "ingest"}    ${file} (${docs.length} chunks)`);
  }

  const total = await chunks.countDocuments();
  console.log(`\n${total} chunks in collection. Atlas will now auto-embed new ones with ${INDEX_MODEL} (billed per token).`);
}

async function ensureIndexes() {
  const chunks = getChunks();
  const existing = new Set<string>();
  for await (const idx of chunks.listSearchIndexes()) existing.add(idx.name);

  if (!existing.has(VECTOR_INDEX)) {
    await chunks.createSearchIndex({
      name: VECTOR_INDEX,
      type: "vectorSearch",
      definition: {
        fields: [
          { type: "autoEmbed", modality: "text", path: "text", model: INDEX_MODEL },
          { type: "filter", path: "sourceFile" },
        ],
      },
    });
    console.log(`created vector index ${VECTOR_INDEX} (autoEmbed, ${INDEX_MODEL})`);
  }

  if (!existing.has(TEXT_INDEX)) {
    await chunks.createSearchIndex({
      name: TEXT_INDEX,
      type: "search",
      definition: {
        mappings: {
          dynamic: false,
          fields: { text: { type: "string" }, heading: { type: "string" } },
        },
      },
    });
    console.log(`created text search index ${TEXT_INDEX}`);
  }
}

async function waitUntilQueryable() {
  const chunks = getChunks();
  process.stdout.write("waiting for indexes to become queryable ");
  for (;;) {
    const indexes = [];
    for await (const idx of chunks.listSearchIndexes()) indexes.push(idx);
    const pending = indexes.filter((i) => !(i as { queryable?: boolean }).queryable);
    if (indexes.length >= 2 && pending.length === 0) break;
    process.stdout.write(".");
    await new Promise((r) => setTimeout(r, 5000));
  }
  console.log(" ready.");
  console.log("Note: embedding generation is async — brand-new chunks may take another minute to be searchable.");
}

await ingest();
await ensureIndexes();
await waitUntilQueryable();
process.exit(0);
