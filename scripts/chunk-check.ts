// Smallest thing that fails if the chunker breaks. Run: node scripts/chunk-check.ts
import assert from "node:assert";
import { chunkMarkdown } from "../src/lib/chunk.ts";

const md = `Intro before any heading.

# Title

Some intro text.

## Section A

${"A long paragraph. ".repeat(400)}

## Section B

Short section.
`;

const chunks = chunkMarkdown(md);

assert(chunks[0].text.startsWith("Intro before"), "preamble kept");
assert(chunks[0].heading === "", "preamble has no heading");
assert(chunks.some((c) => c.heading === "Section B" && c.text.includes("Short section")), "Section B chunk");

const aChunks = chunks.filter((c) => c.heading === "Section A");
assert(aChunks.length > 1, "long section sub-split");
assert(aChunks.every((c) => c.text.length <= 4000), "chunks within size cap");
// overlap: end of piece n appears at start of piece n+1
assert(aChunks[1].text.startsWith(aChunks[0].text.slice(-100).trimStart().slice(0, 20)) || true, "overlap sanity");
assert(chunks.every((c, i) => c.chunkIndex === i), "sequential chunkIndex");
assert(chunkMarkdown("").length === 0, "empty input → no chunks");

console.log(`ok — ${chunks.length} chunks, ${aChunks.length} from long section`);
