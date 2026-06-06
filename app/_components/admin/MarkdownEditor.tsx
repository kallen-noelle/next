"use client";

import { useState, useRef, useCallback } from "react";
import ArticleContent from "@/app/_components/article/ArticleContent";
import { upload } from "@/lib/api/media";

interface Props {
  value: string;
  onChange: (v: string) => void;
}

export default function AdminMarkdownEditor({ value, onChange }: Props) {
  const [tab, setTab] = useState<"edit" | "preview">("edit");
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const insertImage = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) return;
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
    }
  }, [value, onChange]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await insertImage(file);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handlePaste = useCallback(async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith("image/")) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) await insertImage(file);
        return;
      }
    }
  }, [insertImage]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.types.includes("Files")) setDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => setDragging(false), []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const files = Array.from(e.dataTransfer.files);
    for (const file of files) {
      if (file.type.startsWith("image/")) await insertImage(file);
    }
  }, [insertImage]);

  return (
    <div
      className="relative border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag overlay */}
      {dragging && (
        <div className="absolute inset-0 z-10 bg-indigo-500/10 dark:bg-indigo-500/20 border-2 border-dashed border-indigo-400 rounded-xl flex items-center justify-center pointer-events-none">
          <span className="text-sm font-bold text-indigo-500 bg-white/80 dark:bg-slate-900/80 px-4 py-2 rounded-lg">
            释放以上传图片
          </span>
        </div>
      )}

      <div className="flex items-center border-b border-slate-200 dark:border-slate-700 bg-white/40 dark:bg-slate-800/50">
        <button onClick={() => setTab("edit")} className={`px-4 py-2 text-xs font-bold ${tab === "edit" ? "text-indigo-500 border-b-2 border-indigo-500" : "text-slate-400"}`}>Edit</button>
        <button onClick={() => setTab("preview")} className={`px-4 py-2 text-xs font-bold ${tab === "preview" ? "text-indigo-500 border-b-2 border-indigo-500" : "text-slate-400"}`}>Preview</button>
        <div className="flex-1" />
        {tab === "edit" && (
          <>
            <button onClick={() => fileRef.current?.click()} disabled={uploading} className="px-3 py-1.5 mr-1 text-xs text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors disabled:opacity-40">
              {uploading ? "Uploading..." : "+ Image"}
            </button>
            <span className="text-[10px] text-slate-400 mr-2 hidden sm:inline">拖拽 / Ctrl+V 粘贴</span>
          </>
        )}
        <input ref={fileRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
      </div>
      {tab === "edit" ? (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onPaste={handlePaste}
          rows={18}
          className="w-full bg-transparent text-sm outline-none p-4 resize-none text-slate-800 dark:text-slate-200"
          placeholder="Write Markdown...  (拖拽图片 / Ctrl+V 粘贴 / + Image 按钮)"
        />
      ) : (
        <div className="p-4 prose prose-sm dark:prose-invert max-w-none">
          <ArticleContent content={value} />
        </div>
      )}
    </div>
  );
}
