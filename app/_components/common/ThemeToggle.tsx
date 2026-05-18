"use client";

import { useThemeStore } from "@/stores/themeStore";

export default function ThemeToggle() {
  const theme = useThemeStore((s) => s.theme);
  const toggle = useThemeStore((s) => s.toggle);

  return (
    <button
      onClick={toggle}
      className="glass-btn flex items-center justify-center w-9 h-9 !p-0"
      aria-label="Toggle theme"
    >
      <span className="text-sm leading-none">
        {theme === "light" ? "☾" : "☼"}
      </span>
    </button>
  );
}
