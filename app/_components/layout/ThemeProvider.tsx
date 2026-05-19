"use client";
import { createContext, useContext, useState, useCallback, useSyncExternalStore } from "react";

const ThemeContext = createContext({ isDark: true, toggleTheme: () => {} });

function subscribe() {
  return () => {};
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
  const [isDark, setIsDark] = useState(() => stored !== "light");

  const toggleTheme = useCallback(() => {
    setIsDark((prev) => {
      const next = !prev;
      const root = document.documentElement;
      if (next) {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
      window.localStorage.setItem("blog-theme", next ? "dark" : "light");
      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
