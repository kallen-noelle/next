"use client";

import { useState, useEffect, useCallback } from "react";
import type { Technology } from "@/lib/types";
import { getTechList, createTech, removeTech } from "@/lib/api/project";
import Dialog from "@/app/_components/common/Dialog";
import { showSuccessToast } from "@/lib/toast";
import { useConfirm } from "@/app/_components/common/ConfirmDialog";
import Pagination from "@/app/_components/common/Pagination";
import Tooltip from "@/app/_components/common/Tooltip";

export default function AdminTechPage() {
  const { confirm, ConfirmDialog } = useConfirm();
  const [items, setItems] = useState<Technology[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [pageNum, setPageNum] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState("");

  const refresh = useCallback(async () => {
    try { const d = await getTechList(); setItems(d); } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  // Client-side filter + paginate
  const filtered = keyword.trim()
    ? items.filter((t) => t.name.toLowerCase().includes(keyword.toLowerCase()))
    : items;
  const total = filtered.length;
  const paged = filtered.slice((pageNum - 1) * pageSize, pageNum * pageSize);

  // Reset page on keyword change
  useEffect(() => { setPageNum(1); }, [keyword]);

  const openAdd = () => {
    setEditingId(null);
    setName("");
    setDialogOpen(true);
  };

  const openEdit = (t: Technology) => {
    setEditingId(t.id!);
    setName(t.name);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    if (editingId) { await createTech({ id: editingId, name: name.trim() }); showSuccessToast("Updated"); }
    else { await createTech({ name: name.trim() }); showSuccessToast("Created"); }
    setDialogOpen(false);
    refresh();
  };

  const handleDelete = async (id: number) => {
    const ok = await confirm("Delete?"); if (!ok) return;
    await removeTech(id); showSuccessToast("Deleted");
    refresh();
  };

  if (loading) return <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mt-10" />;

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-6">Tech</h1>

      {/* Search + Add */}
      <div className="flex gap-3 mb-6">
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Search tech..."
          className="glass-card !rounded-xl px-4 py-2.5 flex-1 text-sm outline-none bg-white/50 dark:bg-slate-800/50"
        />
        <button onClick={openAdd} className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-bold rounded-xl transition-colors">
          Add Tech
        </button>
      </div>

      {/* Tech list */}
      <div className="flex-1 overflow-auto flex flex-col gap-2">
        {paged.map((t) => (
          <div key={t.id} className="glass-card px-4 py-3 flex items-center gap-4 group">
            <span className="flex-1 text-sm font-bold">{t.name}</span>
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <Tooltip text="Edit">
                <button onClick={() => openEdit(t)} className="p-1 text-indigo-400 hover:text-indigo-600 transition-colors">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                </button>
              </Tooltip>
              <Tooltip text="Delete">
                <button onClick={() => handleDelete(t.id!)} className="p-1 text-red-400 hover:text-red-600 transition-colors">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </Tooltip>
            </div>
          </div>
        ))}
      </div>

      <Pagination total={total} pageNum={pageNum} pageSize={pageSize} onChange={setPageNum} onPageSizeChange={(ps) => { setPageSize(ps); setPageNum(1); }} />

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} title={editingId ? "Edit Tech" : "Add Tech"}>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleSave(); }}
          placeholder="Tech name"
          className="w-full glass-card !rounded-xl px-4 py-2.5 text-sm outline-none bg-white/50 dark:bg-slate-800/50 mb-4"
        />
        <div className="flex justify-end gap-3">
          <button onClick={() => setDialogOpen(false)} className="px-4 py-2 text-sm text-slate-400 hover:text-slate-600 transition-colors">Cancel</button>
          <button onClick={handleSave} className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-bold rounded-xl transition-colors">Save</button>
        </div>
      </Dialog>
      {ConfirmDialog}
    </div>
  );
}
