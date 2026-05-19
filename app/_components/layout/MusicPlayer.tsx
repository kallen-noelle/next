"use client";

import { useMusicStore } from "@/stores/musicStore";

export default function MusicPlayer() {
  const currentTrack = useMusicStore((s) => s.currentTrack);
  const isPlaying = useMusicStore((s) => s.isPlaying);
  const toggle = useMusicStore((s) => s.toggle);

  if (!currentTrack) return null;

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40">
      <div className="glass-card !rounded-full px-4 py-2 flex items-center gap-3">
        {currentTrack.pictureUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={currentTrack.pictureUrl}
            alt={currentTrack.title}
            className="w-8 h-8 rounded-full object-cover ring-1 ring-white/20"
          />
        )}
        <p className="text-sm text-slate-500 dark:text-slate-400 truncate max-w-[160px]">
          {currentTrack.title}
        </p>
        <button onClick={toggle} className="glass-btn !rounded-full !p-1.5 text-xs leading-none">
          {isPlaying ? "⏸" : "▶"}
        </button>
      </div>
    </div>
  );
}
