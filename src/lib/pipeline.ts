import type { Document } from "mongodb";

export const QUERY_MODELS = ["voyage-4-lite", "voyage-4", "voyage-4-large"] as const;
export type QueryModel = (typeof QUERY_MODELS)[number];

export const SEARCH_MODES = ["semantic", "hybrid", "rerank"] as const;
export type SearchMode = (typeof SEARCH_MODES)[number];

export const VECTOR_INDEX = "auto_embed_index";
export const TEXT_INDEX = "text_index";
export const INDEX_MODEL = "voyage-4-large";
export const RERANK_MODEL = "rerank-2.5";

const LIMIT = 5;
const RETRIEVE = 20;

const PROJECT = {
  $project: {
    _id: 0,
    text: 1,
    sourceFile: 1,
    heading: 1,
    chunkIndex: 1,
    score: { $meta: "score" },
  },
};

function vectorSearchStage(query: string, model: QueryModel, limit: number) {
  return {
    $vectorSearch: {
      index: VECTOR_INDEX,
      path: "text",
      query,
      model,
      numCandidates: 100,
      limit,
    },
  };
}

/** Single source of truth: these exact pipelines are executed by the API and displayed in the UI. */
export function buildPipeline(mode: SearchMode, query: string, model: QueryModel): Document[] {
  switch (mode) {
    case "semantic":
      return [
        vectorSearchStage(query, model, LIMIT),
        {
          $project: {
            _id: 0,
            text: 1,
            sourceFile: 1,
            heading: 1,
            chunkIndex: 1,
            score: { $meta: "vectorSearchScore" },
          },
        },
      ];
    case "hybrid":
      return [
        {
          $rankFusion: {
            input: {
              pipelines: {
                semantic: [vectorSearchStage(query, model, RETRIEVE)],
                fullText: [
                  {
                    $search: {
                      index: TEXT_INDEX,
                      text: { query, path: ["text", "heading"] },
                    },
                  },
                  { $limit: RETRIEVE },
                ],
              },
            },
            combination: { weights: { semantic: 0.7, fullText: 0.3 } },
          },
        },
        { $limit: LIMIT },
        PROJECT,
      ];
    case "rerank":
      return [
        vectorSearchStage(query, model, RETRIEVE),
        {
          $rerank: {
            model: RERANK_MODEL,
            query: { text: query },
            numDocsToRerank: RETRIEVE,
            path: ["heading", "text"],
          },
        },
        { $limit: LIMIT },
        PROJECT,
      ];
  }
}

/** Compass/mongosh-ready rendering of the pipeline. */
export function renderShellQuery(pipeline: Document[]): string {
  return `db.doc_chunks.aggregate(${JSON.stringify(pipeline, null, 2)})`;
}
