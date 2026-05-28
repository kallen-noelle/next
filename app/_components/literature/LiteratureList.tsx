"use client";

import { useState, useEffect, useMemo } from "react";
import type { OpTag, OpArticle } from "@/lib/types";
import { getArticleList } from "@/lib/api/op";
import LiteratureCard from "./LiteratureCard";
import Pagination from "../common/Pagination";
import Loading from "../common/Loading";

export default function LiteratureList() {
  const [tags, setTags] = useState<OpTag[]>([]);
  const [selectedTagId, setSelectedTagId] = useState<number | undefined>();
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(true);
  const [pageNum, setPageNum] = useState(1);
  const pageSize = 12;

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await getArticleList();
        setTags(data.rows);
      } catch {
        setTags([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const allArticles = useMemo(() => {
    const list: OpArticle[] = [];
    for (const tag of tags) {
      for (const article of tag.articles) {
        list.push(article);
      }
    }
    return list;
  }, [tags]);

  const filtered = useMemo(() => {
    let list = selectedTagId
      ? tags.find((t) => t.id === selectedTagId)?.articles ?? []
      : allArticles;

    if (keyword) {
      const kw = keyword.toLowerCase();
      list = list.filter((a) => a.title.toLowerCase().includes(kw));
    }
    return list;
  }, [tags, selectedTagId, keyword, allArticles]);

  const paged = useMemo(() => {
    const start = (pageNum - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, pageNum]);

  useEffect(() => setPageNum(1), [selectedTagId, keyword]);

  if (loading) return <Loading />;
  if (tags.length === 0) return <p className="text-center py-10 text-slate-400">Tomcat data unavailable.</p>;

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => { setSelectedTagId(undefined); setPageNum(1); }}
          className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${!selectedTagId ? "bg-indigo-500 text-white" : "glass-btn"}`}
        >
          All
        </button>
        {tags.map((t) => (
          <button
            key={t.id}
            onClick={() => { setSelectedTagId(t.id); setPageNum(1); }}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${selectedTagId === t.id ? "bg-indigo-500 text-white" : "glass-btn"}`}
          >
            {t.name}
          </button>
        ))}
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Search..."
          className="ml-auto glass-card !rounded-xl px-3 py-1 text-xs w-40 outline-none"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {paged.map((item) => (
          <LiteratureCard key={item.id} item={item} />
        ))}
      </div>
      <Pagination pageNum={pageNum} pageSize={pageSize} total={filtered.length} onChange={setPageNum} />
    </div>
  );
}
