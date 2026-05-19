"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { Project } from "@/lib/types";
import api from "@/lib/axios";
import { getList, remove } from "@/lib/api/project";

export default function AdminProjectPage() {
  const [items, setItems] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try { const d = await getList({ pageNum: 1, pageSize: 100 }); setItems(d.rows); } catch {}
    finally { setLoading(false); }
  };
  useEffect(() => { refresh(); }, []);

  const handleDelete = async (id: number) => {
    if (!confirm("Delete?")) return;
    await remove(id); refresh();
  };

  const handlePublish = async (id: number) => { await api.put(`/project/${id}/publish`); refresh(); };
  const handleUnpublish = async (id: number) => { await api.put(`/project/${id}/unpublish`); refresh(); };

  if (loading) return <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mt-10" />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Projects</h1>
        <Link href="/admin/project/new" className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-bold rounded-xl">New Project</Link>
      </div>
      <div className="flex flex-col gap-2">
        {items.map((p) => (
          <div key={p.id} className="glass-card px-4 py-3 flex items-center gap-4">
            <span className={`w-2 h-2 rounded-full ${p.isPublished ? "bg-green-500" : "bg-amber-500"}`} title={p.isPublished ? "Published" : "Draft"} />
            <span className="flex-1 text-sm font-bold">{p.name}</span>
            <Link href={`/admin/project/${p.id}/edit`} className="text-indigo-400 text-xs">edit</Link>
            <button onClick={() => p.isPublished ? handleUnpublish(p.id!) : handlePublish(p.id!)} className="text-emerald-400 text-xs">{p.isPublished ? "unpub" : "pub"}</button>
            <button onClick={() => handleDelete(p.id!)} className="text-red-400 text-xs">del</button>
          </div>
        ))}
      </div>
    </div>
  );
}
