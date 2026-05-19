"use client";

import { useState, useRef } from "react";
import ArticleContent from "@/app/_components/article/ArticleContent";
import { upload } from "@/lib/api/media";

interface Props {
  value: string;
  onChange: (v: string) => void;
}

export default function AdminMarkdownEditor({ value, onChange }: Props) {
  const [tab, setTab] = useState<"edit" | "preview">("edit");
  const [uploading, setUploading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleInsertImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const data = await upload(file) as unknown as { fileUrl?: string } | string;
      const url = typeof data === "string" ? data : data.fileUrl || "";
      if (url) {
        const ta = textareaRef.current;
        const start = ta?.selectionStart ?? value.length;
        const end = ta?.selectionEnd ?? value.length;
        const markdown = `![${file.name}](${url})`;
        const newValue = value.slice(0, start) + markdown + value.slice(end);
        onChange(newValue);
        // Restore cursor after the inserted markdown
        setTimeout(() => {
          if (ta) {
            ta.focus();
            ta.selectionStart = ta.selectionEnd = start + markdown.length;
          }
        }, 0);
      }
    } catch { /* silent */ }
    finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
      <div className="flex items-center border-b border-slate-200 dark:border-slate-700 bg-white/40 dark:bg-slate-800/50">
        <button onClick={() => setTab("edit")} className={`px-4 py-2 text-xs font-bold ${tab === "edit" ? "text-indigo-500 border-b-2 border-indigo-500" : "text-slate-400"}`}>Edit</button>
        <button onClick={() => setTab("preview")} className={`px-4 py-2 text-xs font-bold ${tab === "preview" ? "text-indigo-500 border-b-2 border-indigo-500" : "text-slate-400"}`}>Preview</button>
        <div className="flex-1" />
        {tab === "edit" && (
          <button onClick={() => fileRef.current?.click()} disabled={uploading} className="px-3 py-1.5 mr-2 text-xs text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors disabled:opacity-40">
            {uploading ? "Uploading..." : "+ Image"}
          </button>
        )}
        <input ref={fileRef} type="file" accept="image/*" onChange={handleInsertImage} className="hidden" />
      </div>
      {tab === "edit" ? (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={18}
          className="w-full bg-transparent text-sm outline-none p-4 resize-none text-slate-800 dark:text-slate-200"
          placeholder="Write Markdown...  (click + Image to insert at cursor)"
        />
      ) : (
        <div className="p-4 prose prose-sm dark:prose-invert max-w-none">
          <ArticleContent content={value} />
        </div>
      )}
    </div>
  );
}
