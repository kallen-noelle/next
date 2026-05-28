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
        const data = await getArticleList();
        const numId = Number(id);
        const found = data.rows
          .flatMap((t) => t.articles)
          .find((a) => a.id === numId || a.title === id);
        setItem(found || null);
      } catch {
        setItem(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) return <div className="py-24"><Loading /></div>;
  if (!item) return <div className="text-center py-24 text-slate-400">Work not found.</div>;

  return (
    <>
      <h1 className="text-3xl sm:text-4xl font-black tracking-tighter text-slate-900 dark:text-white">{item.title}</h1>
      {item.writtenAt && <p className="mt-4 text-sm text-slate-400">{item.writtenAt}</p>}
      {item.content && (
        <div className="mt-8 glass-card p-8 text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
          {item.content}
        </div>
      )}
    </>
  );
}
