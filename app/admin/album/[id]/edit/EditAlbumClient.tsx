"use client";

import { useState, useEffect, use, useRef } from "react";
import { useRouter } from "next/navigation";
import type { Album, Photo } from "@/lib/types";
import { getAlbumDetail, updateAlbum, getPhotosByAlbum, createPhoto, deletePhoto } from "@/lib/api/album";
import { upload } from "@/lib/api/media";
import Tooltip from "@/app/_components/common/Tooltip";
import { showSuccessToast } from "@/lib/toast";
import { useConfirm } from "@/app/_components/common/ConfirmDialog";

export default function EditAlbumPage(props: { params: Promise<{ id: string }> }) {
  const { id } = use(props.params);
  const router = useRouter();
  const { confirm, ConfirmDialog } = useConfirm();

  const [album, setAlbum] = useState<Album | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [isPublished, setIsPublished] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Photo upload
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      try {
        const [a, p] = await Promise.all([
          getAlbumDetail(Number(id)),
          getPhotosByAlbum(Number(id)),
        ]);
        if (a) {
          setAlbum(a);
          setTitle(a.title);
          setDescription(a.description || "");
          setSortOrder(a.sortOrder || 0);
          setIsPublished(a.isPublished ?? 1);
        }
        setPhotos(Array.isArray(p) ? p : []);
      } catch { } finally { setLoading(false); }
    })();
  }, [id]);

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      await updateAlbum({ id: Number(id), title: title.trim(), description: description.trim(), sortOrder, isPublished } satisfies Album);
      showSuccessToast("已保存");
    } catch { } finally { setSaving(false); }
  };

  const handleUploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      for (const f of files) {
        const res = await upload(f);
        const fileUrl = (res as any)?.data?.fileUrl ?? (res as any)?.fileUrl;
        if (fileUrl) {
          await createPhoto({ albumId: Number(id), url: fileUrl, sortOrder: photos.length } satisfies Photo);
        }
      }
      const p = await getPhotosByAlbum(Number(id));
      setPhotos(Array.isArray(p) ? p : []);
      showSuccessToast(`已添加 ${files.length} 张`);
    } catch { } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleDeletePhoto = async (photoId: number) => {
    const ok = await confirm("删除此照片？"); if (!ok) return;
    try {
      await deletePhoto(photoId);
      setPhotos((p) => p.filter((ph) => ph.id !== photoId));
      showSuccessToast("已删除");
    } catch { }
  };

  if (loading) return <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mt-10" />;
  if (!album) return <p className="text-center text-slate-400 py-10">Album not found.</p>;

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-6">Edit Album</h1>

      {/* Album Info */}
      <div className="glass-card !rounded-xl p-6 space-y-5 mb-8">
        <div>
          <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-1.5">Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)}
            className="w-full glass-card !rounded-xl px-4 py-2.5 text-sm outline-none bg-white/50 dark:bg-slate-800/50" />
        </div>
        <div>
          <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-1.5">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
            className="w-full glass-card !rounded-xl px-4 py-2.5 text-sm outline-none bg-white/50 dark:bg-slate-800/50 resize-none" />
        </div>
        <div className="flex gap-6">
          <div className="flex-1">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-1.5">Sort Order</label>
            <input type="number" value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value))}
              className="w-full glass-card !rounded-xl px-4 py-2.5 text-sm outline-none bg-white/50 dark:bg-slate-800/50" />
          </div>
          <div className="flex items-end pb-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={!!isPublished} onChange={(e) => setIsPublished(e.target.checked ? 1 : 0)}
                className="w-4 h-4 rounded border-slate-300 dark:border-slate-600" />
              <span className="text-sm text-slate-600 dark:text-slate-400">Published</span>
            </label>
          </div>
        </div>
        <button onClick={handleSave} disabled={saving || !title.trim()}
          className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-colors">
          {saving ? "Saving..." : "Save Album"}
        </button>
      </div>

      {/* Photos */}
      <h2 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-4">Photos ({photos.length})</h2>

      <div className="flex gap-3 mb-6">
        <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleUploadPhoto} className="hidden" />
        <button onClick={() => fileRef.current?.click()} disabled={uploading}
          className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-colors">
          {uploading ? "上传中..." : "选择图片上传"}
        </button>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
        {photos.map((ph) => (
          <div key={ph.id} className="relative group rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 aspect-square">
            <img src={ph.url} alt={`照片 ${ph.id}`} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Tooltip text="Delete">
                <button onClick={() => handleDeletePhoto(ph.id!)} className="p-2 bg-red-500/80 hover:bg-red-600 rounded-full transition-colors">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </Tooltip>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-3 mt-8">
        <button onClick={() => router.push("/admin/album")} className="px-4 py-2 text-sm text-slate-400 hover:text-slate-600 transition-colors">
          ← Back to Albums
        </button>
      </div>
      {ConfirmDialog}
    </div>
  );
}
