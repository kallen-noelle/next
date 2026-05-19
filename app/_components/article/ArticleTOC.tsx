"use client";

import { useState, useEffect, useMemo } from "react";

interface TOCItem {
  id: string;
  text: string;
  level: number;
}

function extractTOC(content: string): TOCItem[] {
  const items: TOCItem[] = [];
  const regex = /^(#{1,3})\s+(.+)$/gm;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const text = match[2].trim();
    const id = text.toLowerCase().replace(/[^a-z0-9一-鿿]+/g, "-").replace(/(^-|-$)/g, "");
    items.push({ id, text, level: match[1].length });
  }
  return items;
}

export default function ArticleTOC({ content }: { content: string }) {
  const items = useMemo(() => extractTOC(content), [content]);
  const [activeId, setActiveId] = useState("");

  useEffect(() => {
    const onScroll = () => {
      for (let i = items.length - 1; i >= 0; i--) {
        const el = document.getElementById(items[i].id);
        if (el && el.getBoundingClientRect().top <= 120) {
          setActiveId(items[i].id);
          return;
        }
      }
      if (items.length > 0) setActiveId(items[0].id);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [items]);

  if (items.length === 0) return null;

  return (
    <nav className="glass-card p-4 text-sm">
      <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3">
        Contents
      </h4>
      <ul className="space-y-0.5">
        {items.map((item) => (
          <li key={item.id} style={{ paddingLeft: `${(item.level - 1) * 12}px` }}>
            <a
              href={`#${item.id}`}
              className={`block py-1 text-xs transition-colors hover:text-indigo-500 ${
                activeId === item.id
                  ? "text-indigo-600 dark:text-indigo-400 font-bold"
                  : "text-slate-500 dark:text-slate-400"
              }`}
            >
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
