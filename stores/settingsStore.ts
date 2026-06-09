import { create } from "zustand";

interface SettingsState {
  bgImageIndex: number;    // -1 = auto rotate, 0-N = specific image
  bgBlur: number;          // 0-20px backdrop blur
  particleDensity: number; // 0-1000 (0=off, 50=default)
  setBgImage: (index: number) => void;
  setBgBlur: (blur: number) => void;
  setParticleDensity: (density: number) => void;
}

export const useSettingsStore = create<SettingsState>()(
  (set) => ({
    bgImageIndex: -1,
    bgBlur: 12,
    particleDensity: 50,
    setBgImage: (index) => set({ bgImageIndex: index }),
    setBgBlur: (blur) => set({ bgBlur: blur }),
    setParticleDensity: (density) => set({ particleDensity: density }),
  })
);
