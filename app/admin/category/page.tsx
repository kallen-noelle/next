"use client";

import { useState, useEffect } from "react";
import type { Category } from "@/lib/types";
import { getList, create, update, remove } from "@/lib/api/category";

export default function AdminCategoryPage() {
  const [items, setItems] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [type, setType] = useState<Category["type"]>("ARTICLE");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try { const d = await getList(); setItems(d.rows); } catch {}
    finally { setLoading(false); }
  };
  useEffect(() => { refresh(); }, []);

  const handleSave = async () => {
    if (!name.trim()) return;
    if (editingId) await update({ id: editingId, name: name.trim(), type });
    else await create({ name: name.trim(), type });
    setName(""); setEditingId(null); refresh();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete?")) return;
    await remove(id); refresh();
  };

  if (loading) return <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mt-10" />;

  return (
    <div>
      <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-6">Categories</h1>
      <div className="flex gap-3 mb-6 flex-wrap">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Category name" className="glass-card !rounded-xl px-4 py-2.5 w-48 text-sm outline-none bg-white/50 dark:bg-slate-800/50" />
        <select value={type} onChange={(e) => setType(e.target.value as Category["type"])} className="glass-card !rounded-xl px-4 py-2.5 text-sm outline-none bg-white/50 dark:bg-slate-800/50">
          <option value="ARTICLE">ARTICLE</option>
          <option value="PROJECT">PROJECT</option>
        </select>
        <button onClick={handleSave} className="px-4 py-2 bg-indigo-500 text-white text-sm font-bold rounded-xl">{editingId ? "Update" : "Add"}</button>
        {editingId && <button onClick={() => { setName(""); setEditingId(null); }} className="px-3 py-2 text-sm text-slate-400">Cancel</button>}
      </div>
      <div className="flex flex-col gap-2">
        {items.map((c) => (
          <div key={c.id} className="glass-card px-4 py-3 flex items-center gap-4">
            <span className="text-xs px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 font-mono">{c.type}</span>
            <span className="flex-1 text-sm font-bold">{c.name}</span>
            <button onClick={() => { setEditingId(c.id!); setName(c.name); setType(c.type); }} className="text-indigo-400 text-xs">edit</button>
            <button onClick={() => handleDelete(c.id!)} className="text-red-400 text-xs">del</button>
          </div>
        ))}
      </div>
    </div>
  );
}
