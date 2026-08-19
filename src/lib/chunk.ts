export interface Chunk {
  text: string;
  heading: string;
  chunkIndex: number;
}

const MAX_CHARS = 4000;
const PIECE_CHARS = 3000;
const OVERLAP_CHARS = 400;

/**
 * Markdown-aware chunker: split on #/##/### headings, then sub-split
 * sections longer than MAX_CHARS into overlapping pieces.
 */
export function chunkMarkdown(markdown: string): Chunk[] {
  const lines = markdown.split("\n");
  const sections: { heading: string; body: string[] }[] = [
    { heading: "", body: [] },
  ];

  for (const line of lines) {
    const m = /^#{1,3}\s+(.*)/.exec(line);
    if (m) {
      sections.push({ heading: m[1].trim(), body: [line] });
    } else {
      sections[sections.length - 1].body.push(line);
    }
  }

  const chunks: Chunk[] = [];
  for (const section of sections) {
    const text = section.body.join("\n").trim();
    if (!text) continue;

    if (text.length <= MAX_CHARS) {
      chunks.push({ text, heading: section.heading, chunkIndex: chunks.length });
      continue;
    }
    // ponytail: overlap split on char offsets, not sentence boundaries; upgrade if chunk quality disappoints
    for (let start = 0; start < text.length; start += PIECE_CHARS - OVERLAP_CHARS) {
      const piece = text.slice(start, start + PIECE_CHARS).trim();
      if (piece) {
        chunks.push({ text: piece, heading: section.heading, chunkIndex: chunks.length });
      }
      if (start + PIECE_CHARS >= text.length) break;
    }
  }
  return chunks;
}
