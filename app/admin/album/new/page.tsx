"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createAlbum } from "@/lib/api/album";
import { showSuccessToast } from "@/lib/toast";

export default function NewAlbumPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      const res = await createAlbum({ title: title.trim(), description: description.trim(), isPublished: 1 });
      const id = (res as any)?.data ?? (res as any)?.id;
      showSuccessToast("已创建");
      router.push(id ? `/admin/album/${id}/edit` : "/admin/album");
    } catch {} finally { setSaving(false); }
  };

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-6">New Album</h1>

      <div className="glass-card !rounded-xl p-6 space-y-5">
        <div>
          <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-1.5">Title</label>
          <input autoFocus value={title} onChange={(e) => setTitle(e.target.value)}
            className="w-full glass-card !rounded-xl px-4 py-2.5 text-sm outline-none bg-white/50 dark:bg-slate-800/50" />
        </div>
        <div>
          <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-1.5">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
            className="w-full glass-card !rounded-xl px-4 py-2.5 text-sm outline-none bg-white/50 dark:bg-slate-800/50 resize-none" />
        </div>
      </div>

      <div className="flex gap-3 mt-6">
        <button onClick={() => router.back()} className="px-4 py-2 text-sm text-slate-400 hover:text-slate-600 transition-colors">Cancel</button>
        <button onClick={handleSave} disabled={saving || !title.trim()}
          className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-colors">
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}
