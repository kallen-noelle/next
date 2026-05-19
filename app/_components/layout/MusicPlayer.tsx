"use client";

import { useEffect, useRef } from "react";
import { useMusicStore } from "@/stores/musicStore";
import { getMusic } from "@/lib/api/op";

export default function MusicPlayer() {
  const currentTrack = useMusicStore((s) => s.currentTrack);
  const isPlaying = useMusicStore((s) => s.isPlaying);
  const toggle = useMusicStore((s) => s.toggle);
  const setTrack = useMusicStore((s) => s.setTrack);
  const pause = useMusicStore((s) => s.pause);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Fetch initial track
  useEffect(() => {
    if (currentTrack) return;
    getMusic()
      .then((track) => setTrack(track))
      .catch(() => {});
  }, [currentTrack, setTrack]);

  // Control <audio> element
  useEffect(() => {
    if (!currentTrack) return;
    if (!audioRef.current) {
      audioRef.current = new Audio(currentTrack.url);
      audioRef.current.addEventListener("ended", () => {
        pause();
        // Fetch next random track
        getMusic().then((t) => setTrack(t)).catch(() => {});
      });
    }
    if (isPlaying) {
      audioRef.current.play().catch(() => {});
    } else {
      audioRef.current.pause();
    }
  }, [currentTrack, isPlaying, pause, setTrack]);

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
