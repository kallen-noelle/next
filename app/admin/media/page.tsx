"use client";

import { useState, useEffect, useRef } from "react";
import type { Media } from "@/lib/types";
import { getList, upload, remove } from "@/lib/api/media";

export default function AdminMediaPage() {
  const [items, setItems] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const refresh = async () => {
    try { const d = await getList({ pageNum: 1, pageSize: 50 }); setItems(d.rows); } catch {}
    finally { setLoading(false); }
  };
  useEffect(() => { refresh(); }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setUploading(true);
    try {
      await upload(f);
      refresh();
    } catch { alert("Upload failed."); }
    finally { setUploading(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete?")) return;
    await remove(id); refresh();
  };

  if (loading) return <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mt-10" />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Media</h1>
        <button onClick={() => fileRef.current?.click()} disabled={uploading} className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-bold rounded-xl disabled:opacity-50">
          {uploading ? "Uploading..." : "Upload"}
        </button>
        <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
      </div>
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {items.map((m) => (
          <div key={m.id} className="glass-card p-2 group relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={m.fileUrl} alt={m.originalFilename || ""} className="w-full h-24 object-cover rounded-lg" />
            <p className="text-[10px] text-slate-400 truncate mt-1">{m.originalFilename}</p>
            <button onClick={() => handleDelete(m.id!)} className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-[10px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity">X</button>
          </div>
        ))}
      </div>
    </div>
  );
}
