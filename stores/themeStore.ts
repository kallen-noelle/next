import { create } from "zustand";
import { persist } from "zustand/middleware";

type Theme = "light" | "dark";

interface ThemeState {
  theme: Theme;
  toggle: () => void;
  setTheme: (theme: Theme) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: "light",
      toggle: () => {
        const next = get().theme === "light" ? "dark" : "light";
        set({ theme: next });
      },
      setTheme: (theme) => set({ theme }),
    }),
    { name: "blog-theme" },
  ),
);

// Apply theme attribute on client side
if (typeof window !== "undefined") {
  const applyTheme = (theme: Theme) => {
    document.documentElement.setAttribute("data-theme", theme);
  };
  const saved = localStorage.getItem("blog-theme");
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      applyTheme(parsed.state?.theme || "light");
    } catch {
      applyTheme("light");
    }
  }
  useThemeStore.subscribe((state) => applyTheme(state.theme));
}
