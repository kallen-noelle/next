"use client";

import { useState, useEffect } from "react";
import { get, update, type AboutMap } from "@/lib/api/about";
import { showSuccessToast, showErrorToast } from "@/lib/toast";
import AdminMarkdownEditor from "@/app/_components/admin/MarkdownEditor";

export default function AdminAboutPage() {
  const [data, setData] = useState<AboutMap>({});
  const [saving, setSaving] = useState(false);
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");

  useEffect(() => {
    get().then(setData).catch(() => setData({}));
  }, []);

  const setField = (key: string, value: string) => {
    setData((prev) => ({ ...prev, [key]: value }));
  };

  const removeField = (key: string) => {
    setData((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const addField = () => {
    if (!newKey.trim()) return;
    setData((prev) => ({ ...prev, [newKey.trim()]: newValue }));
    setNewKey("");
    setNewValue("");
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await update(data);
      showSuccessToast("Saved");
    } catch {
      showErrorToast("Save failed");
    } finally {
      setSaving(false);
    }
  };

  // Separate content from other fields
  const { content, ...fields } = data;

  const renderValue = (key: string, value: string) => {
    if (key === "socialLinks") {
      return (
        <textarea
          value={value}
          onChange={(e) => setField(key, e.target.value)}
          rows={3}
          className="w-full text-xs font-mono bg-transparent outline-none resize-none"
          placeholder='[{"name":"Twitter","url":"https://..."}]'
        />
      );
    }
    return (
      <input
        value={value}
        onChange={(e) => setField(key, e.target.value)}
        className="w-full text-sm bg-transparent outline-none"
      />
    );
  };

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">About Me</h1>
        <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-50">
          {saving ? "Saving..." : "Save"}
        </button>
      </div>

      <div className="flex-1 overflow-auto space-y-6">
        {/* Content (Markdown) */}
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-2">content (Markdown)</label>
          <AdminMarkdownEditor
            value={content || ""}
            onChange={(v) => setField("content", v)}
          />
        </div>

        {/* Other fields */}
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-2">Fields</label>
          <div className="space-y-1">
            {Object.entries(fields).map(([key, value]) => (
              <div key={key} className="flex items-center gap-2 group">
                <span className="w-32 text-xs font-bold text-indigo-500 flex-shrink-0 pl-3 border-l-2 border-indigo-300 dark:border-indigo-700">
                  {key}
                </span>
                <div className="flex-1 glass-card !rounded-lg px-3 py-2">
                  {renderValue(key, value)}
                </div>
                <button
                  onClick={() => removeField(key)}
                  className="w-6 h-6 rounded-full text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                  title="Remove"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            ))}
          </div>

          {/* Add new field */}
          <div className="flex items-center gap-2 mt-3">
            <input
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              placeholder="key"
              className="w-32 flex-shrink-0 glass-card !rounded-lg px-3 py-2 text-xs outline-none bg-white/50 dark:bg-slate-800/50"
            />
            <input
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              placeholder="value"
              onKeyDown={(e) => { if (e.key === "Enter") addField(); }}
              className="flex-1 glass-card !rounded-lg px-3 py-2 text-xs outline-none bg-white/50 dark:bg-slate-800/50"
            />
            <button onClick={addField} className="px-3 py-2 text-xs font-bold text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors flex-shrink-0">
              + Add
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
