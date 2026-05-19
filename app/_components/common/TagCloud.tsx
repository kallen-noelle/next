"use client";

import type { Tag } from "@/lib/types";

interface Props {
  tags: Tag[];
  activeId?: number;
  onSelect: (id: number | undefined) => void;
}

export default function TagCloud({ tags, activeId, onSelect }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onSelect(undefined)}
        className={`px-3 py-1 rounded-full text-xs font-bold transition-all duration-300 ${
          !activeId
            ? "bg-indigo-500 text-white"
            : "glass-btn"
        }`}
      >
        All
      </button>
      {tags.map((tag) => (
        <button
          key={tag.id}
          onClick={() => onSelect(tag.id)}
          className={`px-3 py-1 rounded-full text-xs font-bold transition-all duration-300 ${
            activeId === tag.id
              ? "bg-indigo-500 text-white"
              : "glass-btn"
          }`}
        >
          {tag.name}
        </button>
      ))}
    </div>
  );
}
