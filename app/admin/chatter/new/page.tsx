"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { create } from "@/lib/api/chatter";
import { upload } from "@/lib/api/media";
import { showSuccessToast } from "@/lib/toast";
import SelectDropdown from "@/app/_components/admin/SelectDropdown";

const MOODS = [
  "开心", "快乐", "高兴", "愉悦",
  "难过", "悲伤", "伤心", "哀愁",
  "疲惫", "累", "困", "无力",
  "兴奋", "激动",
  "平静", "安宁", "放松", "惬意",
  "烦躁", "愤怒", "恼火", "不耐烦",
  "迷茫", "困惑", "不解", "无措",
  "想念", "怀念", "思恋", "回忆",
  "随想", "灵感", "思考", "冥想",
  "惊喜", "惊讶", "震惊",
  "感恩", "感动", "温暖", "治愈",
  "孤独", "寂寞", "失落", "沮丧",
  "焦虑", "紧张", "担心", "不安",
  "自豪", "满足", "自信", "坚定",
  "无聊", "懒散", "发呆",
  "生病", "难受", "痛苦", "晕",
  "美好", "浪漫", "甜蜜", "幸福",
  "酸", "嫉妒", "苦涩",
  "辣", "刺激", "冒险",
  "冷", "热", "饿", "饱",
  "赞", "棒", "优秀", "绝了",
];

export default function NewChatterPage() {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [mood, setMood] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await upload(file);
      const url = (res as any)?.fileUrl ?? (res as any)?.data?.fileUrl ?? "";
      if (url) setImageUrls((p) => [...p, url]);
    } catch {} finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleSave = async () => {
    if (!content.trim()) return;
    setSaving(true);
    try {
      await create({
        content: content.trim(),
        mood: mood || undefined,
        images: imageUrls.length > 0 ? imageUrls : undefined,
        isPublished: 1,
      });
      showSuccessToast("已创建");
      router.push("/admin/chatter");
    } catch {} finally { setSaving(false); }
  };

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-6">New Chatter</h1>

      <div className="glass-card !rounded-xl p-6 space-y-5">
        <div>
          <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-1.5">Content</label>
          <textarea autoFocus value={content} onChange={(e) => setContent(e.target.value)} rows={6}
            className="w-full glass-card !rounded-xl px-4 py-2.5 text-sm outline-none bg-white/50 dark:bg-slate-800/50 resize-none" />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-1.5">Mood</label>
          <SelectDropdown
            options={MOODS}
            value={mood}
            onChange={(v) => setMood(v as string)}
            placeholder="无"
            renderOption={(m) => m}
            getValue={(m) => m}
            searchable
          />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-1.5">Images</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {imageUrls.map((url, i) => (
              <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-700 group">
                <img src={url} alt="" className="w-full h-full object-cover" />
                <button onClick={() => setImageUrls((p) => p.filter((_, j) => j !== i))}
                  className="absolute top-0.5 right-0.5 w-5 h-5 bg-red-500/80 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
              </div>
            ))}
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
          <button onClick={() => fileRef.current?.click()} disabled={uploading}
            className="px-3 py-1.5 text-xs text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors border border-indigo-200 dark:border-indigo-800">
            {uploading ? "上传中..." : "+ 上传图片"}
          </button>
        </div>
      </div>

      <div className="flex gap-3 mt-6">
        <button onClick={() => router.back()} className="px-4 py-2 text-sm text-slate-400 hover:text-slate-600 transition-colors">Cancel</button>
        <button onClick={handleSave} disabled={saving || !content.trim()}
          className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-colors">
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}
