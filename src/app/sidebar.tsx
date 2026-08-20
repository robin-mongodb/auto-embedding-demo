"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Sidebar() {
  const pathname = usePathname();
  const inDocs = pathname.startsWith("/docs");
  return (
    <nav className="sidebar">
      <div className="sidebar-title">Atlas Demo</div>
      <Link href="/" className={!inDocs ? "active" : ""}>
        Search within docs
      </Link>
      <Link href="/docs" className={inDocs ? "active" : ""}>
        Browse docs
      </Link>
    </nav>
  );
}
