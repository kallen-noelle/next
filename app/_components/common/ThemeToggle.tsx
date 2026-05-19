"use client";

import { useTheme } from "../layout/ThemeProvider";

export default function ThemeToggleBlock() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <div
      onClick={toggleTheme}
      className={`rounded-2xl backdrop-blur-md border shadow-lg px-3 py-2 flex items-center gap-2 transition-all duration-500 hover:scale-[1.05] cursor-pointer group overflow-hidden ${
        isDark ? "bg-slate-800/40 border-slate-600/50" : "bg-white/40 border-white/60"
      }`}
    >
      <div className="relative w-8 h-8 rounded-full overflow-hidden flex-shrink-0 shadow-inner">
        <div
          className={`absolute inset-0 transition-transform duration-700 ${isDark ? "-translate-y-full" : "translate-y-0"} bg-gradient-to-tr from-sky-300 to-yellow-200`}
        />
        <div
          className={`absolute inset-0 transition-transform duration-700 ${isDark ? "translate-y-0" : "translate-y-full"} bg-gradient-to-tr from-indigo-900 to-slate-800`}
        />
        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-all duration-700 text-sm ${
            isDark ? "opacity-0 rotate-90 scale-50" : "opacity-100 rotate-0 scale-100"
          }`}
        >
          🌸
        </div>
        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-all duration-700 text-sm ${
            isDark ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-90 scale-50"
          }`}
        >
          ✨
        </div>
      </div>
      <span className={`text-xs font-bold transition-colors duration-500 ${isDark ? "text-white" : "text-slate-800"}`}>
        {isDark ? "夜间" : "日间"}
      </span>
    </div>
  );
}
