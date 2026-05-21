import { create } from "zustand";
import type { OpMusic } from "@/lib/types";

interface MusicState {
  currentTrack: OpMusic | null;
  isPlaying: boolean;
  setTrack: (track: OpMusic) => void;
  toggle: () => void;
  pause: () => void;
  play: () => void;
}

export const useMusicStore = create<MusicState>()((set) => ({
  currentTrack: null,
  isPlaying: false,

  setTrack: (track) => set({ currentTrack: track }),
  toggle: () => set((s) => ({ isPlaying: !s.isPlaying })),
  pause: () => set({ isPlaying: false }),
  play: () => set({ isPlaying: true }),
}));
