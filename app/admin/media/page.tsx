"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { Media } from "@/lib/types";
import { getList, upload, remove } from "@/lib/api/media";
import Tooltip from "@/app/_components/common/Tooltip";
import { showSuccessToast } from "@/lib/toast";
import { useConfirm } from "@/app/_components/common/ConfirmDialog";
import Pagination from "@/app/_components/common/Pagination";

export default function AdminMediaPage() {
  const { confirm, ConfirmDialog } = useConfirm();
  const [items, setItems] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [pageNum, setPageNum] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [total, setTotal] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(async (kw?: string, pn?: number, ps?: number) => {
    try {
      const d = await getList({ pageNum: pn || 1, pageSize: ps || 12, query: kw ? ({ originalFilename: kw } as Media) : undefined });
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

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setUploading(true);
    try {
      await upload(f); showSuccessToast("Uploaded");
      refresh(keyword || undefined, pageNum, pageSize);
    } catch { alert("Upload failed.");  }
    finally { setUploading(false); }
  };

  const handleDelete = async (id: number) => {
    const ok = await confirm("Delete?"); if (!ok) return;
    await remove(id); showSuccessToast("Deleted");
    refresh(keyword || undefined, pageNum, pageSize);
  };

  if (loading) return <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mt-10" />;

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Media</h1>
        <button onClick={() => fileRef.current?.click()} disabled={uploading} className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-bold rounded-xl disabled:opacity-50 transition-colors">
          {uploading ? "Uploading..." : "Upload"}
        </button>
        <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Search media by filename..."
          className="glass-card !rounded-xl px-4 py-2.5 w-full text-sm outline-none bg-white/50 dark:bg-slate-800/50"
        />
      </div>

      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {items.map((m) => (
            <div key={m.id} className="glass-card p-2 group relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={m.fileUrl} alt={m.originalFilename || ""} className="w-full h-24 object-cover rounded-lg" />
              <p className="text-[10px] text-slate-400 truncate mt-1">{m.originalFilename}</p>
              <Tooltip text="Delete">
                <button onClick={() => handleDelete(m.id!)} className="absolute top-1 right-1 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </Tooltip>
            </div>
          ))}
        </div>
      </div>

      <Pagination total={total} pageNum={pageNum} pageSize={pageSize} onChange={(pn) => { setPageNum(pn); refresh(keyword || undefined, pn, pageSize); }} onPageSizeChange={(ps) => { setPageSize(ps); setPageNum(1); refresh(keyword || undefined, 1, ps); }} />
      {ConfirmDialog}
    </div>
  );
}
