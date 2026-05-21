"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import type { Article } from "@/lib/types";
import { getList } from "@/lib/api/article";
import api from "@/lib/axios";
import { showSuccessToast } from "@/lib/toast";
import { useConfirm } from "@/app/_components/common/ConfirmDialog";
import Pagination from "@/app/_components/common/Pagination";
import Tooltip from "@/app/_components/common/Tooltip";

export default function AdminArticlePage() {
  const { confirm, ConfirmDialog } = useConfirm();
  const [items, setItems] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [pageNum, setPageNum] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

  const refresh = useCallback(async (kw?: string, pn?: number, ps?: number) => {
    try {
      const d = await getList(kw || undefined, pn, ps);
      setItems(d.rows);
      setTotal(d.total);
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  // Debounced search (reset to page 1)
  useEffect(() => {
    setPageNum(1);
    const timer = setTimeout(() => refresh(keyword || undefined, 1, pageSize), 300);
    return () => clearTimeout(timer);
  }, [keyword, refresh, pageSize]);

  const handleDelete = async (id: number) => {
    const ok = await confirm("Delete?"); if (!ok) return;
    await api.delete(`/article/${id}`); showSuccessToast("Deleted");
    refresh(keyword || undefined, pageNum, pageSize);
  };

  const handlePublish = async (id: number) => { await api.put(`/article/${id}/publish`); showSuccessToast("Published"); refresh(keyword || undefined, pageNum, pageSize); };
  const handleUnpublish = async (id: number) => { await api.put(`/article/${id}/unpublish`); showSuccessToast("Unpublished"); refresh(keyword || undefined, pageNum, pageSize); };
  const handlePin = async (id: number) => { await api.put(`/article/${id}/pin`); showSuccessToast("Pinned/Unpinned"); refresh(keyword || undefined, pageNum, pageSize); };

  if (loading) return <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mt-10" />;

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-6">Articles</h1>

      {/* Search + Add */}
      <div className="flex gap-3 mb-6">
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Search articles by title..."
          className="glass-card !rounded-xl px-4 py-2.5 flex-1 text-sm outline-none bg-white/50 dark:bg-slate-800/50"
        />
        <Link href="/admin/article/new" className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-bold rounded-xl transition-colors">New Article</Link>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="flex flex-col gap-2">
          {items.map((a) => (
            <div key={a.id} className="glass-card px-4 py-3 flex items-center gap-4 group">
              <Tooltip text={a.isPublished ? "Published" : "Draft"}><span className={`w-2 h-2 rounded-full ${a.isPublished ? "bg-green-500" : "bg-amber-500"}`} /></Tooltip>
              <span className="flex-1 text-sm font-bold truncate">{a.title}</span>
              <span className="text-xs text-slate-400">{a.viewCount || 0} 👁</span>
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <Tooltip text="Edit">
                  <Link href={`/admin/article/${a.id}/edit`} className="p-1 text-indigo-400 hover:text-indigo-600 transition-colors">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                  </Link>
                </Tooltip>
                <Tooltip text={a.isPublished ? "Published" : "Draft"}>
                  <button onClick={() => a.isPublished ? handleUnpublish(a.id!) : handlePublish(a.id!)} className="p-1 text-emerald-400 hover:text-emerald-600 transition-colors">
                    {a.isPublished ? (
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    ) : (
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                    )}
                  </button>
                </Tooltip>
                <Tooltip text={a.isPinned ? "Unpin" : "Pin"}>
                  <button onClick={() => handlePin(a.id!)} className="p-1 text-amber-400 hover:text-amber-600 transition-colors">
                    {a.isPinned ? (
                      <svg className="w-3.5 h-3.5" fill="currentColor" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                    ) : (
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                    )}
                  </button>
                </Tooltip>
                <Tooltip text="Delete">
                  <button onClick={() => handleDelete(a.id!)} className="p-1 text-red-400 hover:text-red-600 transition-colors">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </Tooltip>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Pagination total={total} pageNum={pageNum} pageSize={pageSize} onChange={(pn) => { setPageNum(pn); refresh(keyword || undefined, pn, pageSize); }} onPageSizeChange={(ps) => { setPageSize(ps); setPageNum(1); refresh(keyword || undefined, 1, ps); }} />
      {ConfirmDialog}
    </div>
  );
}
