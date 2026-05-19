"use client";

import { useState, useEffect } from "react";
import type { About } from "@/lib/types";
import { get as getAbout, update } from "@/lib/api/about";
import AdminMarkdownEditor from "@/app/_components/admin/MarkdownEditor";

export default function AdminAboutPage() {
  const [about, setAbout] = useState<About | null>(null);
  const [content, setContent] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [socialLinks, setSocialLinks] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    getAbout().then((data) => {
      setAbout(data);
      setContent(data.content || "");
      setContactEmail(data.contactEmail || "");
      setGithubUrl(data.githubUrl || "");
      setSocialLinks(data.socialLinks || "");
    }).catch(() => {});
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMsg("");
    try {
      await update({
        id: about?.id,
        content,
        contactEmail,
        githubUrl,
        socialLinks,
      });
      setMsg("Saved.");
    } catch {
      setMsg("Save failed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">About Me</h1>
        <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-50">
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
      {msg && <p className="text-sm text-green-500 mb-3">{msg}</p>}
      <label className="block text-xs font-bold text-slate-500 mb-1">Content (Markdown)</label>
      <AdminMarkdownEditor value={content} onChange={setContent} />
      <div className="grid grid-cols-2 gap-4 mt-6">
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1">Contact Email</label>
          <input value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} className="glass-card !rounded-xl px-4 py-2.5 w-full text-sm outline-none bg-white/50 dark:bg-slate-800/50" />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1">GitHub URL</label>
          <input value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} className="glass-card !rounded-xl px-4 py-2.5 w-full text-sm outline-none bg-white/50 dark:bg-slate-800/50" />
        </div>
      </div>
      <div className="mt-4">
        <label className="block text-xs font-bold text-slate-500 mb-1">Social Links (JSON)</label>
        <textarea value={socialLinks} onChange={(e) => setSocialLinks(e.target.value)} rows={4} className="glass-card !rounded-xl px-4 py-2.5 w-full text-sm outline-none bg-white/50 dark:bg-slate-800/50 resize-none" placeholder='[{"name":"Twitter","url":"https://..."}]' />
      </div>
    </div>
  );
}
