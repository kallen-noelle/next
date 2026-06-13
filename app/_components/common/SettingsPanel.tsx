"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSettingsStore } from "@/stores/settingsStore";
import { siteConfig } from "@/lib/siteConfig";
import { assetUrl } from "@/lib/asset-url";
import Tooltip from "@/app/_components/common/Tooltip";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function SettingsPanel({ open, onClose }: Props) {
  const {
    bgImageIndex, bgBlur, particleDensity,
    setBgImage, setBgBlur, setParticleDensity,
  } = useSettingsStore();
  const [showGrid, setShowGrid] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const images = siteConfig.bgImages;
  const currentIndex = bgImageIndex === -1 ? 0 : bgImageIndex;

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, onClose]);

  function prev() {
    const total = images.length;
    const idx = bgImageIndex === -1 ? total - 1 : (bgImageIndex - 1 + total) % total;
    setBgImage(idx);
  }

  function next() {
    const total = images.length;
    const idx = bgImageIndex === -1 ? 0 : (bgImageIndex + 1) % total;
    setBgImage(idx);
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={panelRef}
          initial={{ opacity: 0, y: -4, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -4, scale: 0.97 }}
          transition={{ duration: 0.15 }}
          className="absolute right-0 top-full mt-2 w-72 p-4 shadow-2xl z-50 rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-white/50 dark:border-white/10"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">设置</h3>
          </div>

          {/* 背景图片 */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                背景图片
              </label>
              <Tooltip text="查看全部背景">
                <button type="button"
                  onClick={() => setShowGrid(!showGrid)}
                className="w-5 h-5 rounded flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-sky-500 dark:hover:text-sky-400 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  {showGrid ? (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                  )}
                </svg>
              </button>
              </Tooltip>
            </div>

            {showGrid && (
              <div className="grid grid-cols-3 gap-1.5 mb-2">
                {images.map((img, i) => (
                  <Tooltip text="选择此背景">
                    <button key={img} type="button"
                      onClick={() => { setBgImage(i); setShowGrid(false); }}
                    className={`relative rounded-lg overflow-hidden border-2 transition-all aspect-video ${
                      i === currentIndex
                        ? "border-sky-500 ring-1 ring-sky-500/30"
                        : "border-transparent hover:border-sky-300"
                    }`}
                  >
                    <img src={assetUrl(img)} alt="背景" className="w-full h-full object-cover" />
                  </button>
                  </Tooltip>
                ))}
              </div>
            )}

            <div className="relative rounded-xl overflow-hidden border-2 border-white/30 dark:border-white/10 aspect-video">
              <img src={assetUrl(images[currentIndex])} alt="当前背景" className="w-full h-full object-cover" />
              <Tooltip text="上一张">
                <button type="button" onClick={prev}
                className="absolute left-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
              </button>
              </Tooltip>
              <Tooltip text="下一张">
                <button type="button" onClick={next}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              </button>
              </Tooltip>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                {images.map((img, i) => (
                  <button key={img} type="button" title={`切换到背景 ${i + 1}`} onClick={() => setBgImage(i)}
                    className={`w-1.5 h-1.5 rounded-full transition-all ${
                      i === currentIndex ? "bg-white w-3" : "bg-white/50 hover:bg-white/80"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* 背景模糊度 */}
          <div className="mb-4">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 block">
              背景模糊度
            </label>
            <div className="flex items-center gap-3">
              <input type="range" min="0" max="20" step="1" value={bgBlur}
                onChange={(e) => setBgBlur(Number(e.target.value))}
                className="flex-1 h-1.5 bg-white/40 dark:bg-slate-700/50 rounded-full appearance-none outline-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #818cf8 ${(bgBlur / 20) * 100}%, rgba(148,163,184,0.4) ${(bgBlur / 20) * 100}%)`,
                }}
              />
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400 w-10 text-right">{bgBlur}px</span>
            </div>
          </div>

          {/* 粒子浓度 */}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 block">
              粒子浓度
            </label>
            <div className="flex items-center gap-3">
              <input type="range" min="0" max="1000" value={particleDensity}
                onChange={(e) => setParticleDensity(Number(e.target.value))}
                className="flex-1 h-1.5 bg-white/40 dark:bg-slate-700/50 rounded-full appearance-none outline-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #818cf8 ${particleDensity / 10}%, rgba(148,163,184,0.4) ${particleDensity / 10}%)`,
                }}
              />
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400 w-8 text-right">
                {particleDensity === 0 ? "关" : `${(particleDensity / 10).toFixed(0)}%`}
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
