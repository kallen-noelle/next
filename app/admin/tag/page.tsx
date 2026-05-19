"use client";

import { useState, useEffect } from "react";
import type { Tag } from "@/lib/types";
import { getList, create, update, remove } from "@/lib/api/tag";

export default function AdminTagPage() {
  const [items, setItems] = useState<Tag[]>([]);
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try { const d = await getList(); setItems(d.rows); } catch {}
    finally { setLoading(false); }
  };
  useEffect(() => { refresh(); }, []);

  const handleSave = async () => {
    if (!name.trim()) return;
    if (editingId) await update({ id: editingId, name: name.trim() });
    else await create({ name: name.trim() } satisfies Tag);
    setName(""); setEditingId(null); refresh();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete?")) return;
    await remove(id); refresh();
  };

  if (loading) return <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mt-10" />;

  return (
    <div>
      <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-6">Tags</h1>
      <div className="flex gap-3 mb-6">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tag name" className="glass-card !rounded-xl px-4 py-2.5 flex-1 text-sm outline-none bg-white/50 dark:bg-slate-800/50" />
        <button onClick={handleSave} className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-bold rounded-xl">{editingId ? "Update" : "Add"}</button>
        {editingId && <button onClick={() => { setName(""); setEditingId(null); }} className="px-3 py-2 text-sm text-slate-400">Cancel</button>}
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map((t) => (
          <span key={t.id} className="glass-card !rounded-xl px-4 py-2 text-sm flex items-center gap-3">
            {t.name}
            <button onClick={() => { setEditingId(t.id!); setName(t.name); }} className="text-indigo-400 text-xs">edit</button>
            <button onClick={() => handleDelete(t.id!)} className="text-red-400 text-xs">del</button>
          </span>
        ))}
      </div>
    </div>
  );
}
