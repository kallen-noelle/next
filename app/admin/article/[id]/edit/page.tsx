"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import type { Category, Tag } from "@/lib/types";
import api from "@/lib/axios";
import { getList as getCategories } from "@/lib/api/category";
import { getList as getTags } from "@/lib/api/tag";
import AdminMarkdownEditor from "@/app/_components/admin/MarkdownEditor";

export default function EditArticlePage(props: { params: Promise<{ id: string }> }) {
  const { id } = use(props.params);
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [categoryId, setCategoryId] = useState<number>(0);
  const [tagIds, setTagIds] = useState<number[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    getCategories().then((d) => setCategories(d.rows.filter((c) => c.type === "ARTICLE"))).catch(() => {});
    getTags().then((d) => setTags(d.rows)).catch(() => {});
    api.get(`/article/${id}`).then((raw: unknown) => {
      const a = raw as Record<string, unknown>;
      setTitle(String(a.title || ""));
      setSummary(String(a.summary || ""));
      setContent(String(a.content || ""));
      setCoverImage(String(a.coverImage || ""));
      setCategoryId(Number(a.categoryId || 0));
      setTagIds((a.tagIds as number[]) || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      await api.put("/article", { id: Number(id), title: title.trim(), summary, content, coverImage, categoryId, tagIds });
      router.push("/admin/article");
    } catch { alert("Save failed."); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mt-10" />;

  return (
    <div>
      <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-6">Edit Article</h1>
      <div className="glass-card p-4 space-y-4">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="glass-card !rounded-xl px-4 py-2.5 w-full text-sm outline-none bg-white/50 dark:bg-slate-800/50" />
        <input value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="Summary" className="glass-card !rounded-xl px-4 py-2.5 w-full text-sm outline-none bg-white/50 dark:bg-slate-800/50" />
        <input value={coverImage} onChange={(e) => setCoverImage(e.target.value)} placeholder="Cover image URL" className="glass-card !rounded-xl px-4 py-2.5 w-full text-sm outline-none bg-white/50 dark:bg-slate-800/50" />
        <div className="flex gap-4">
          <select value={categoryId} onChange={(e) => setCategoryId(Number(e.target.value))} className="glass-card !rounded-xl px-4 py-2.5 text-sm outline-none bg-white/50 dark:bg-slate-800/50">
            <option value={0}>Select category</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <div className="flex flex-wrap gap-1">
            {tags.map((t) => (
              <label key={t.id} className={`px-3 py-1 text-xs rounded-full cursor-pointer border ${tagIds.includes(t.id!) ? "bg-indigo-500 text-white border-indigo-500" : "glass-card"}`}>
                <input type="checkbox" checked={tagIds.includes(t.id!)} onChange={() => setTagIds((prev) => prev.includes(t.id!) ? prev.filter((x) => x !== t.id) : [...prev, t.id!])} className="sr-only" />
                {t.name}
              </label>
            ))}
          </div>
        </div>
        <label className="block text-xs font-bold text-slate-500">Content (Markdown)</label>
        <AdminMarkdownEditor value={content} onChange={setContent} />
        <button onClick={handleSave} disabled={saving} className="px-6 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-bold rounded-xl disabled:opacity-50">Save</button>
      </div>
    </div>
  );
}
