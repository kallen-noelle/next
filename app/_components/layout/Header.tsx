"use client";

import Link from "next/link";
import ThemeToggle from "@/app/_components/common/ThemeToggle";

const NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/article", label: "Articles" },
  { href: "/project", label: "Projects" },
  { href: "/timeline", label: "Timeline" },
  { href: "/about", label: "About" },
];

export default function Header() {
  return (
    <header className="sticky top-0 z-50 glass-card !rounded-none !border-x-0 !border-t-0 border-b border-[var(--border)]">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 h-16">
        <Link href="/" className="text-lg font-semibold tracking-wide text-[var(--text)]">
          Dream Blog
        </Link>
        <nav className="hidden md:flex items-center gap-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="px-3 py-1.5 text-sm rounded-lg text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--color-card-hover-bg)] transition-all duration-200"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
