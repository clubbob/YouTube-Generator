"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="header">
      <div className="header-container">
        <Link href="/" className="logo">
          YouTube Generator
        </Link>
        <nav className="header-nav">
          <Link 
            href="/trending" 
            className={`nav-link ${pathname === "/trending" ? "active" : ""}`}
          >
            인기 영상 벤치마킹
          </Link>
        </nav>
      </div>
    </header>
  );
}
