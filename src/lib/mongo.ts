import { MongoClient } from "mongodb";

export const DB_NAME = "auto_embedding_demo";
export const CHUNKS_COLLECTION = "doc_chunks";
export const META_COLLECTION = "seed_meta";

// ponytail: lazy singleton so the module can be imported without MONGODB_URI (e.g. during `next build`)
let client: MongoClient | undefined;

export function getDb() {
  if (!client) {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error("MONGODB_URI is not set (add it to .env.local)");
    client = new MongoClient(uri);
  }
  return client.db(DB_NAME);
}

export function getChunks() {
  return getDb().collection(CHUNKS_COLLECTION);
}
