"use client";
import { createContext, useContext, useEffect, useCallback, useSyncExternalStore } from "react";

const ThemeContext = createContext({ isDark: true, toggleTheme: () => {} });

function subscribe(callback: () => void) {
  window.addEventListener("theme-changed", callback);
  return () => window.removeEventListener("theme-changed", callback);
}

function getSnapshot(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("blog-theme");
}

function getServerSnapshot() {
  return null;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const stored = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  // Derive isDark directly from stored snapshot to avoid SSR/hydration mismatch
  const isDark = stored === null ? true : stored !== "light";

  // Sync isDark to <html> classList on mount and on every change
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [isDark]);

  const toggleTheme = useCallback(() => {
    const next = !isDark;
    const root = document.documentElement;
    if (next) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    window.localStorage.setItem("blog-theme", next ? "dark" : "light");
    // Force re-render by dispatching a custom event that subscribe picks up
    window.dispatchEvent(new Event("theme-changed"));
  }, [isDark]);

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
