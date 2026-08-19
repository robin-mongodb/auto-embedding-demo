import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "Atlas Auto-Embedding Demo",
  description: "MongoDB Atlas automated embedding with asymmetric Voyage 4 retrieval",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
