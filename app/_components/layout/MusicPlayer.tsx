"use client";

import { useMusicStore } from "@/stores/musicStore";

export default function MusicPlayer() {
  const currentTrack = useMusicStore((s) => s.currentTrack);
  const isPlaying = useMusicStore((s) => s.isPlaying);
  const toggle = useMusicStore((s) => s.toggle);

  if (!currentTrack) return null;

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 glass-card px-4 py-2 flex items-center gap-3 max-w-sm w-[calc(100%-2rem)]">
      {currentTrack.pictureUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={currentTrack.pictureUrl}
          alt={currentTrack.title}
          className="w-8 h-8 rounded-full object-cover ring-1 ring-[var(--card-border)]"
        />
      )}
      <p className="flex-1 text-sm truncate text-[var(--text-secondary)]">
        {currentTrack.title}
      </p>
      <button onClick={toggle} className="glass-btn !px-2.5 !py-1 text-xs">
        {isPlaying ? "⏸" : "▶"}
      </button>
    </div>
  );
}
