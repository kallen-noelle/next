"use client";

import { useSettingsStore } from "@/stores/settingsStore";

export default function MaskOverlay() {
  const bgBlur = useSettingsStore((s) => s.bgBlur);

  return (
    <>
      {/* 遮罩层 — 仅纯色，不含 blur（参照 Kirameku） */}
      <div className="absolute inset-0 z-[-9] bg-white/30 dark:bg-slate-900/40 transition-colors duration-500" />

      {/* 模糊层 — 独立 div，条件渲染（参照 Kirameku） */}
      {bgBlur > 0 && (
        <div
          className="absolute inset-0 z-[-8]"
          style={{
            backdropFilter: `blur(${bgBlur}px)`,
            WebkitBackdropFilter: `blur(${bgBlur}px)`,
          }}
        />
      )}
    </>
  );
}
