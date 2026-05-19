"use client";

import { useState } from "react";

interface Props {
  onSearch: (keyword: string) => void;
}

export default function SearchBar({ onSearch }: Props) {
  const [value, setValue] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSearch(value.trim());
      }}
      className="relative w-full max-w-md"
    >
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search articles..."
        className="w-full glass-card !rounded-2xl px-4 py-2.5 pr-10 text-sm bg-white/50 dark:bg-slate-800/50 backdrop-blur-xl border-white/40 dark:border-white/10 outline-none focus:border-indigo-400 transition-colors text-slate-900 dark:text-white placeholder-slate-400"
      />
      <button type="submit" className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-500 transition-colors">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
      </button>
    </form>
  );
}
