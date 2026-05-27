"use client";

import { useState, useEffect, useCallback } from "react";
import Tooltip from "@/app/_components/common/Tooltip";

export default function FullscreenToggle() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const toggle = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen();
    }
  }, []);

  return (
    <Tooltip text={isFullscreen ? "退出全屏" : "全屏"} position="bottom">
      <button
        onClick={toggle}
        className={`rounded-2xl backdrop-blur-md border shadow-lg p-2 flex items-center justify-center transition-all duration-500 hover:scale-[1.05] cursor-pointer group overflow-hidden ${
          isFullscreen
            ? "bg-indigo-500/20 dark:bg-indigo-500/30 border-indigo-300/50 dark:border-indigo-400/50 text-indigo-600 dark:text-indigo-300"
            : "bg-white/40 dark:bg-slate-800/40 border-white/60 dark:border-slate-600/50 text-slate-500 dark:text-slate-300"
        }`}
      >
        {isFullscreen ? (
          <svg className="w-5 h-5 transition-transform duration-500 group-hover:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-5 h-5 transition-transform duration-500 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        )}
      </button>
    </Tooltip>
  );
}
