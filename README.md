# Atlas Auto-Embedding Demo

Shows MongoDB Atlas **Automated Embedding** (preview) with **asymmetric retrieval**: documents are
auto-embedded server-side with `voyage-4-large`; queries embed at search time with `voyage-4-lite`
(or any Voyage 4 model — they share one embedding space). Also demos hybrid search (`$rankFusion`)
and native reranking (`$rerank`), each in a side-by-side pane with a copy-pastable pipeline that
reproduces the same results in Compass/mongosh.

## Prerequisites

- Atlas cluster, MongoDB **8.3+** ("Latest version with auto-upgrades"). `$rankFusion` needs 8.1+, `$rerank` needs 8.3+.
- Voyage AI API key linked in Atlas (for autoEmbed and $rerank billing).
- **Native Reranking enabled** in Atlas Project Settings (for the Reranker pane).
- On M10+: storage auto-scaling enabled (autoEmbed requirement).
- Node 22.6+ (runs the TypeScript seed script directly).

## Run

1. Put your connection string in `.env.local` (`MONGODB_URI=...`).
2. Drop MongoDB docs `.md` files into `docs/`.
3. `npm install && npm run seed` — chunks the files, creates both search indexes, waits until queryable.
   Re-run after adding/editing files; unchanged files are skipped (sha256 tracked in `seed_meta`).
4. `npm run dev` → http://localhost:3000

## What to show the Architect

- No embeddings in the app or the documents — Atlas generates them (see the `autoEmbed` index in `scripts/seed.ts`).
- The query-model dropdown: index built with voyage-4-large, query answered with voyage-4-lite.
- Each pane's "Copy" button: paste into Compass aggregations on `auto_embedding_demo.doc_chunks` → identical results.
- Drop a new `.md` into `docs/`, `npm run seed` again → only the new file ingests and becomes searchable.
