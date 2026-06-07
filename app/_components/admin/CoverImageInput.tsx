"use client";

import { useRef, useState } from "react";
import { upload } from "@/lib/api/media";

interface Props {
  value: string;
  onChange: (url: string) => void;
}

export default function CoverImageInput({ value, onChange }: Props) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const media = await upload(file) as unknown as { fileUrl: string };
      if (media?.fileUrl) onChange(media.fileUrl);
    } catch {
      alert("Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Cover image URL"
          className="glass-card !rounded-xl px-4 py-2.5 flex-1 text-sm outline-none bg-white/50 dark:bg-slate-800/50"
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="px-4 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-bold rounded-xl disabled:opacity-50 transition-colors whitespace-nowrap"
        >
          {uploading ? "Uploading..." : "Upload"}
        </button>
        <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
      </div>
      {value && (
        <div className="relative w-32 h-20 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800">
          <img src={value} alt="封面预览" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
        </div>
      )}
    </div>
  );
}
