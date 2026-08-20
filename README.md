# Atlas Auto-Embedding Demo

Shows MongoDB Atlas **Automated Embedding** (preview) with **asymmetric retrieval**: documents are
auto-embedded server-side with `voyage-4-large`; queries embed at search time with `voyage-4-lite`
(or any Voyage 4 model — they share one embedding space). Also demos hybrid search (`$rankFusion`)
and native reranking (`$rerank`), each in a side-by-side pane with a copy-pastable pipeline that
reproduces the same results in Compass/mongosh.

## Prerequisites

All prerequisites are one-time **Atlas project setup** — the demo app itself only needs a connection string.

- Atlas cluster, MongoDB **8.3+** ("Latest version with auto-upgrades"). `$rankFusion` needs 8.1+, `$rerank` needs 8.3+.
- **Native Reranking enabled** in Atlas Project Settings (for the Reranker pane).
- On M10+: storage auto-scaling enabled (autoEmbed requirement).
- Node 22.6+ (runs the TypeScript seed script directly) — **or just Docker**, see below.

## Run with Docker (recommended — no local Node/npm needed)

1. Create `.env.local` with your connection string: `MONGODB_URI=mongodb+srv://...`
2. Drop MongoDB docs `.md` files into `docs/` (they are gitignored; bring your own).
3. Seed and serve:

```sh
docker compose run --rm seed   # chunk docs/*.md + create indexes (re-run after adding files)
docker compose up app          # → http://localhost:3000
```

The seed step is idempotent — unchanged files are skipped (sha256 tracked in `seed_meta`), so re-running after dropping in new files only ingests those.

## Run with local Node (22.6+)

Same `.env.local` and `docs/` setup, then:

```sh
npm install
npm run seed
npm run dev    # → http://localhost:3000
```

## What to demonstrate

- No embeddings in the app or the documents — Atlas generates them (see the `autoEmbed` index in `scripts/seed.ts`).
- The query-model dropdown: index built with voyage-4-large, query answered with voyage-4-lite.
- Each pane's "Copy" button: paste into Compass aggregations on `auto_embedding_demo.doc_chunks` → identical results.
- Drop a new `.md` into `docs/`, `npm run seed` again → only the new file ingests and becomes searchable.
