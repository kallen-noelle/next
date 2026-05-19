"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { Article } from "@/lib/types";
import api from "@/lib/axios";

export default function AdminArticlePage() {
  const [items, setItems] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      const d = await api.post("/article/page", { pageNum: 1, pageSize: 100 }) as { total: number; rows: Article[] };
      setItems(d.rows);
    } catch {}
    finally { setLoading(false); }
  };
  useEffect(() => { refresh(); }, []);

  const handleDelete = async (id: number) => {
    if (!confirm("Delete?")) return;
    await api.delete(`/article/${id}`);
    refresh();
  };

  const handlePublish = async (id: number) => { await api.put(`/article/${id}/publish`); refresh(); };
  const handleUnpublish = async (id: number) => { await api.put(`/article/${id}/unpublish`); refresh(); };
  const handlePin = async (id: number) => { await api.put(`/article/${id}/pin`); refresh(); };

  if (loading) return <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mt-10" />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Articles</h1>
        <Link href="/admin/article/new" className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-bold rounded-xl">New Article</Link>
      </div>
      <div className="flex flex-col gap-2">
        {items.map((a) => (
          <div key={a.id} className="glass-card px-4 py-3 flex items-center gap-4">
            <span className={`w-2 h-2 rounded-full ${a.isPublished ? "bg-green-500" : "bg-amber-500"}`} title={a.isPublished ? "Published" : "Draft"} />
            <span className="flex-1 text-sm font-bold truncate">{a.title}</span>
            <span className="text-xs text-slate-400">{a.viewCount || 0} 👁</span>
            <Link href={`/admin/article/${a.id}/edit`} className="text-indigo-400 text-xs">edit</Link>
            <button onClick={() => a.isPublished ? handleUnpublish(a.id!) : handlePublish(a.id!)} className="text-emerald-400 text-xs">{a.isPublished ? "unpub" : "pub"}</button>
            <button onClick={() => handlePin(a.id!)} className="text-amber-400 text-xs">{a.isPinned ? "unpin" : "pin"}</button>
            <button onClick={() => handleDelete(a.id!)} className="text-red-400 text-xs">del</button>
          </div>
        ))}
      </div>
    </div>
  );
}
