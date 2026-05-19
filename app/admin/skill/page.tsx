"use client";

import { useState, useEffect } from "react";
import type { Skill } from "@/lib/types";
import { getList, create, update, remove } from "@/lib/api/skill";

export default function AdminSkillPage() {
  const [items, setItems] = useState<Skill[]>([]);
  const [name, setName] = useState("");
  const [proficiency, setProficiency] = useState(80);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try { const d = await getList(); setItems(d); } catch {}
    finally { setLoading(false); }
  };
  useEffect(() => { refresh(); }, []);

  const handleSave = async () => {
    if (!name.trim()) return;
    if (editingId) await update({ id: editingId, name: name.trim(), proficiency });
    else await create({ name: name.trim(), proficiency });
    setName(""); setProficiency(80); setEditingId(null); refresh();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete?")) return;
    await remove(id); refresh();
  };

  if (loading) return <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mt-10" />;

  return (
    <div>
      <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-6">Skills</h1>
      <div className="flex gap-3 mb-6 flex-wrap">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Skill name" className="glass-card !rounded-xl px-4 py-2.5 w-40 text-sm outline-none bg-white/50 dark:bg-slate-800/50" />
        <input type="number" min={0} max={100} value={proficiency} onChange={(e) => setProficiency(Number(e.target.value))} placeholder="Proficiency" className="glass-card !rounded-xl px-4 py-2.5 w-24 text-sm outline-none bg-white/50 dark:bg-slate-800/50" />
        <button onClick={handleSave} className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-bold rounded-xl">{editingId ? "Update" : "Add"}</button>
        {editingId && <button onClick={() => { setName(""); setProficiency(80); setEditingId(null); }} className="px-3 py-2 text-sm text-slate-400">Cancel</button>}
      </div>
      <div className="flex flex-col gap-2">
        {items.map((s) => (
          <div key={s.id} className="glass-card px-4 py-3 flex items-center gap-4">
            <span className="flex-1 text-sm font-bold">{s.name}</span>
            <div className="w-40 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full" style={{ width: `${s.proficiency}%` }} />
            </div>
            <span className="text-xs text-slate-400 w-8 text-right">{s.proficiency}%</span>
            <button onClick={() => { setEditingId(s.id!); setName(s.name); setProficiency(s.proficiency); }} className="text-indigo-400 text-xs">edit</button>
            <button onClick={() => handleDelete(s.id!)} className="text-red-400 text-xs">del</button>
          </div>
        ))}
      </div>
    </div>
  );
}
