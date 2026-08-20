import type { ReactNode } from "react";
import { Sidebar } from "./sidebar";
import "./globals.css";

export const metadata = {
  title: "Atlas Auto-Embedding Demo",
  description: "MongoDB Atlas automated embedding with asymmetric Voyage 4 retrieval",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="shell">
          <Sidebar />
          <div className="content">{children}</div>
        </div>
      </body>
    </html>
  );
}
