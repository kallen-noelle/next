"use client";

import { useState, useEffect, use } from "react";
import type { OpArticle } from "@/lib/types";
import { getArticleList } from "@/lib/api/op";
import Loading from "@/app/_components/common/Loading";

export default function LiteratureDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = use(props.params);
  const [item, setItem] = useState<OpArticle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        // Op API searches by title/tag — get single item via page query with id
        const data = await getArticleList({ pageNum: 1, pageSize: 1, query: { title: id } });
        setItem(data.rows[0] || null);
      } catch { setItem(null); }
      finally { setLoading(false); }
    })();
  }, [id]);

  if (loading) return <div className="py-24"><Loading /></div>;
  if (!item) return <div className="text-center py-24 text-slate-400">Work not found.</div>;

  return (
    <>
      <h1 className="text-3xl sm:text-4xl font-black tracking-tighter text-slate-900 dark:text-white">{item.title}</h1>
      {item.weather && <span className="inline-block mt-2 text-xs px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500">{item.weather}</span>}
      {item.writtenAt && <p className="mt-4 text-sm text-slate-400">{item.writtenAt}</p>}
      {/* Content is on Tomcat — basic info displayed */}
      <div className="mt-8 glass-card p-8">
        <p className="text-slate-500 dark:text-slate-400 italic">The full content is hosted on the Tomcat server. This page provides metadata and categorization.</p>
      </div>
    </>
  );
}
