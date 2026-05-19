"use client";

import { useState, useEffect } from "react";
import type { OpArticle, OpCategory } from "@/lib/types";
import { getCategories, getArticleList } from "@/lib/api/op";
import LiteratureCard from "./LiteratureCard";
import Pagination from "../common/Pagination";
import Loading from "../common/Loading";

export default function LiteratureList() {
  const [items, setItems] = useState<OpArticle[]>([]);
  const [categories, setCategories] = useState<OpCategory[]>([]);
  const [total, setTotal] = useState(0);
  const [pageNum, setPageNum] = useState(1);
  const [catId, setCatId] = useState<number | undefined>();
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(true);
  const pageSize = 12;

  useEffect(() => {
    getCategories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const query: { title?: string; tagId?: number } = {};
        if (keyword) query.title = keyword;
        if (catId) query.tagId = catId;
        const data = await getArticleList({ pageNum, pageSize, query });
        if (!cancelled) { setItems(data.rows); setTotal(data.total); }
      } catch { if (!cancelled) { setItems([]); setTotal(0); } }
      finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [pageNum, catId, keyword]);

  if (loading) return <Loading />;
  if (items.length === 0) return <p className="text-center py-10 text-slate-400">Tomcat data unavailable.</p>;

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setCatId(undefined)}
          className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${!catId ? "bg-indigo-500 text-white" : "glass-btn"}`}
        >
          All
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setCatId(c.id)}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${catId === c.id ? "bg-indigo-500 text-white" : "glass-btn"}`}
          >
            {c.name}
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
        {items.map((item) => (
          <LiteratureCard key={item.id} item={item} />
        ))}
      </div>
      <Pagination pageNum={pageNum} pageSize={pageSize} total={total} onChange={setPageNum} />
    </div>
  );
}
