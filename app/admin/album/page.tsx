"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import type { Album } from "@/lib/types";
import { getList, deleteAlbum } from "@/lib/api/album";
import Tooltip from "@/app/_components/common/Tooltip";
import Pagination from "@/app/_components/common/Pagination";
import { showSuccessToast } from "@/lib/toast";
import { useConfirm } from "@/app/_components/common/ConfirmDialog";

export default function AdminAlbumPage() {
  const { confirm, ConfirmDialog } = useConfirm();
  const [items, setItems] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [pageNum, setPageNum] = useState(1);
  const [pageSize, setPageSize] = useState(20);
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

  useEffect(() => {
    setPageNum(1);
    const timer = setTimeout(() => refresh(keyword || undefined, 1, pageSize), 300);
    return () => clearTimeout(timer);
  }, [keyword, refresh, pageSize]);

  const handleDelete = async (id: number) => {
    const ok = await confirm("确定删除此相册？"); if (!ok) return;
    await deleteAlbum(id); showSuccessToast("已删除");
    refresh(keyword || undefined, pageNum, pageSize);
  };

  if (loading) return <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mt-10" />;

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-6">Albums</h1>

      <div className="flex gap-3 mb-6">
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Search albums..."
          className="glass-card !rounded-xl px-4 py-2.5 flex-1 text-sm outline-none bg-white/50 dark:bg-slate-800/50"
        />
        <Link href="/admin/album/new" className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-bold rounded-xl transition-colors inline-flex items-center">
          New Album
        </Link>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="grid gap-3">
          {items.map((album) => (
            <div key={album.id} className="glass-card !rounded-xl px-5 py-4 flex items-center gap-4 group">
              <div className="flex-1 min-w-0">
                <Link href={`/admin/album/${album.id}/edit`} className="text-sm font-bold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  {album.title}
                </Link>
                {album.description && (
                  <p className="text-xs text-slate-400 mt-0.5 truncate">{album.description}</p>
                )}
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${album.isPublished ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" : "bg-slate-100 dark:bg-slate-800 text-slate-400"}`}>
                {album.isPublished ? "Published" : "Draft"}
              </span>
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <Tooltip text="Edit">
                  <Link href={`/admin/album/${album.id}/edit`} className="p-1.5 text-indigo-400 hover:text-indigo-600 transition-colors block">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                  </Link>
                </Tooltip>
                <Tooltip text="Delete">
                  <button onClick={() => handleDelete(album.id!)} className="p-1.5 text-red-400 hover:text-red-600 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </Tooltip>
              </div>
            </div>
          ))}
          {items.length === 0 && (
            <p className="text-center text-sm text-slate-400 py-10">No albums found.</p>
          )}
        </div>
      </div>

      <Pagination total={total} pageNum={pageNum} pageSize={pageSize}
        onChange={(pn) => { setPageNum(pn); refresh(keyword || undefined, pn, pageSize); }}
        onPageSizeChange={(ps) => { setPageSize(ps); setPageNum(1); refresh(keyword || undefined, 1, ps); }} />
      {ConfirmDialog}
    </div>
  );
}
