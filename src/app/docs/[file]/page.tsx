import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { notFound } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import type { ComponentProps, ReactNode } from "react";
import { slugify } from "@/lib/slug";

export const dynamic = "force-dynamic";

function textOf(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (node && typeof node === "object" && "props" in node) {
    return textOf((node.props as { children?: ReactNode }).children);
  }
  return "";
}

function heading(Tag: "h1" | "h2" | "h3") {
  return function Heading(props: ComponentProps<"h1">) {
    return <Tag id={slugify(textOf(props.children))}>{props.children}</Tag>;
  };
}

export default async function DocPage({ params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  if (!/^[\w.-]+\.md$/.test(file)) notFound();

  let markdown: string;
  try {
    markdown = await readFile(join(process.cwd(), "docs", file), "utf8");
  } catch {
    notFound();
  }

  return (
    <main className="doc-page">
      <p>
        <Link href="/docs">← all documents</Link>
      </p>
      <ReactMarkdown components={{ h1: heading("h1"), h2: heading("h2"), h3: heading("h3") }}>
        {markdown}
      </ReactMarkdown>
    </main>
  );
}
