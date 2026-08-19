import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
if (!uri) throw new Error("MONGODB_URI is not set (add it to .env.local)");

// ponytail: module-level singleton; fine for a demo, Next.js dev HMR may open a few extra connections
const client = new MongoClient(uri);

export const DB_NAME = "auto_embedding_demo";
export const CHUNKS_COLLECTION = "doc_chunks";
export const META_COLLECTION = "seed_meta";

export function getDb() {
  return client.db(DB_NAME);
}

export function getChunks() {
  return getDb().collection(CHUNKS_COLLECTION);
}
