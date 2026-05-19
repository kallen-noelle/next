"use client";

import { useState, useEffect } from "react";
import type { Timeline } from "@/lib/types";
import { getList, create, update, remove } from "@/lib/api/timeline";

export default function AdminTimelinePage() {
  const [items, setItems] = useState<Timeline[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try { const d = await getList(); setItems(d); } catch {}
    finally { setLoading(false); }
  };
  useEffect(() => { refresh(); }, []);

  const reset = () => { setTitle(""); setDescription(""); setEventDate(""); setEditingId(null); };

  const handleSave = async () => {
    if (!title.trim() || !eventDate.trim()) return;
    if (editingId) await update({ id: editingId, title: title.trim(), description, eventDate });
    else await create({ title: title.trim(), description, eventDate });
    reset(); refresh();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete?")) return;
    await remove(id); refresh();
  };

  if (loading) return <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mt-10" />;

  return (
    <div>
      <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-6">Timeline</h1>
      <div className="flex flex-wrap gap-3 mb-6">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="glass-card !rounded-xl px-4 py-2.5 w-40 text-sm outline-none bg-white/50 dark:bg-slate-800/50" />
        <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" className="glass-card !rounded-xl px-4 py-2.5 w-40 text-sm outline-none bg-white/50 dark:bg-slate-800/50" />
        <input value={eventDate} onChange={(e) => setEventDate(e.target.value)} placeholder="Date (YYYY-MM)" className="glass-card !rounded-xl px-4 py-2.5 w-36 text-sm outline-none bg-white/50 dark:bg-slate-800/50" />
        <button onClick={handleSave} className="px-4 py-2 bg-indigo-500 text-white text-sm font-bold rounded-xl">{editingId ? "Update" : "Add"}</button>
        {editingId && <button onClick={reset} className="px-3 py-2 text-sm text-slate-400">Cancel</button>}
      </div>
      <div className="flex flex-col gap-2">
        {items.map((t) => (
          <div key={t.id} className="glass-card px-4 py-3 flex items-center gap-4">
            <span className="text-xs text-slate-400 w-20">{t.eventDate}</span>
            <span className="flex-1 text-sm font-bold">{t.title}</span>
            <span className="text-xs text-slate-500 flex-1 truncate">{t.description}</span>
            <button onClick={() => { setEditingId(t.id!); setTitle(t.title); setDescription(t.description || ""); setEventDate(t.eventDate); }} className="text-indigo-400 text-xs">edit</button>
            <button onClick={() => handleDelete(t.id!)} className="text-red-400 text-xs">del</button>
          </div>
        ))}
      </div>
    </div>
  );
}
