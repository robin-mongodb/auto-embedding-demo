# Atlas Auto-Embedding Demo

MongoDB Atlas **Automated Embedding** with **asymmetric retrieval**: documents auto-embedded
server-side with `voyage-4-large`, queries embedded with `voyage-4-lite` (shared Voyage 4
embedding space). Includes hybrid search (`$rankFusion`) and native reranking (`$rerank`) in
side-by-side panes, each with a copy-pastable pipeline that reproduces the results in Compass.

## Prerequisites

One-time Atlas setup — the app itself only needs a connection string. No API key: Atlas runs the
Voyage models server-side and bills tokens to your Atlas org (200M free tokens per model).

- Atlas cluster on MongoDB **8.3+** ("Latest Release with auto-upgrades")
- **Native Reranking** enabled in Project Settings
- M10+ only: storage auto-scaling enabled
- Docker, or Node 22.6+

## 1. Install

Both paths need the repo and your Atlas connection string in `.env.local`.

**Docker:**

```sh
git clone https://github.com/robin-mongodb/auto-embedding-demo.git
cd auto-embedding-demo
echo 'MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>/' > .env.local
```

**Node:**

```sh
git clone https://github.com/robin-mongodb/auto-embedding-demo.git
cd auto-embedding-demo
echo 'MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>/' > .env.local
npm install
```

## 2. Load documents

Drop any markdown files into `docs/`:

```sh
cp ~/my-docs/*.md docs/
```

## 3. Seed (chunk + index)

Chunks the files by heading, inserts them, creates the `autoEmbed` vector index and the text
search index, and waits until Atlas finishes embedding. Re-run any time — unchanged files are
skipped, new/edited files are (re)ingested.

```sh
# If using Docker
docker compose run --rm seed

# If using Node
npm run seed
```

## 4. Run

```sh
# If using Docker
docker compose up app

# If using Node
npm run dev
```

In the browser
→ http://localhost:3000

## Demo script

1. Search anything — results show chunk, score, and the exact `$vectorSearch` pipeline. Note: no
   embeddings anywhere in the app; the query pipeline sends plain text.
2. Switch the query model dropdown: document chunks indexed with `voyage-4-large`, queried with `voyage-4-lite`.
3. Check **Hybrid** / **Reranker** for side-by-side `$rankFusion` and `$rerank` panes.
4. Copy any pane's pipeline into Compass (`auto_embedding_demo.doc_chunks`) — same results.
5. Drop a new `.md` into `docs/`, re-run seed — only the new file ingests, then it's searchable.
