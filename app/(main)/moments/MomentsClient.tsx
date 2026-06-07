"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare } from "lucide-react";
import type { Chatter } from "@/lib/types";
import { getPublishedList } from "@/lib/api/chatter";
import Giscus from "@/app/_components/comment/Giscus";
import Loading from "@/app/_components/common/Loading";

const rotations = [-2, 1.5, -1, 2, -1.5, 1, -0.5, 1.5];

function relativeTime(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 1) return "刚刚";
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 3) return `${days}天前`;
  return dateStr.slice(0, 10);
}

export default function MomentsClient() {
  const [chatters, setChatters] = useState<Chatter[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const expandedRef = useRef<HTMLDivElement>(null);

  // Click outside to collapse
  useEffect(() => {
    if (expandedId === null) return;
    const handler = (e: MouseEvent) => {
      if (expandedRef.current && !expandedRef.current.contains(e.target as Node)) {
        setExpandedId(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [expandedId]);

  useEffect(() => {
    getPublishedList().then((d) => {
      setChatters(Array.isArray(d) ? d : []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="py-24"><Loading /></div>;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 md:py-12">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-6 md:mb-12">
        <div className="flex items-center gap-2 md:gap-3 mb-1 md:mb-2">
          <MessageSquare className="w-5 h-5 md:w-7 md:h-7 text-sky-500" />
          <h1 className="text-xl md:text-3xl font-bold text-slate-800 dark:text-slate-100">说说</h1>
        </div>
        <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 ml-7 md:ml-10">记录生活中的小确幸</p>
      </motion.div>

      {!loading && chatters.length === 0 && (
        <div className="text-center py-20 text-slate-400">
          <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-40" />
          <p className="text-sm">暂无说说</p>
        </div>
      )}

      <div className="space-y-6 md:space-y-8">
        {chatters.map((chatter, idx) => {
          const rot = rotations[idx % rotations.length];
          const offsetX = idx % 2 === 0 ? -4 : 4;
          const isExpanded = expandedId === chatter.id;
          let images: string[] = [];
          try { const p = JSON.parse(chatter.images || "[]"); images = Array.isArray(p) ? p : []; } catch {}

          return (
            <motion.div key={chatter.id} layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0, rotate: isExpanded ? 0 : rot, x: isExpanded ? 0 : offsetX }}
              transition={{ type: "spring", stiffness: 300, damping: 25, delay: idx * 0.05 }}
              whileHover={!isExpanded ? { rotate: 0, x: 0, y: -4, scale: 1.01 } : undefined}
              onClick={() => setExpandedId(isExpanded ? null : (chatter.id ?? null))}
              className="cursor-pointer"
              style={{ zIndex: isExpanded ? 50 : chatters.length - idx }}
            >
              <div ref={isExpanded ? expandedRef : undefined}
                className="rounded-2xl bg-white/50 dark:bg-slate-800/60 backdrop-blur-xl border border-white/30 dark:border-white/10 shadow-lg overflow-hidden transition-shadow duration-300 hover:shadow-xl">

                {!isExpanded ? (
                  <div className="px-4 py-3 md:px-5 md:py-4">
                    <div className="flex items-center gap-1.5 md:gap-2 mb-1.5">
                      <span className="text-[10px] md:text-xs text-slate-400">{relativeTime(chatter.createTime || "")}</span>
                      {chatter.mood && <span className="text-[10px] md:text-xs text-slate-400">{chatter.mood}</span>}
                      {images.length > 0 && <span className="text-[10px] md:text-xs text-slate-400">📷</span>}
                    </div>
                    <p className="text-xs md:text-sm text-slate-700 dark:text-slate-300 line-clamp-2 leading-relaxed">{chatter.content}</p>
                  </div>
                ) : (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}
                    onClick={(e) => e.stopPropagation()}>
                    <div className="p-4 md:p-5">
                      <div className="flex items-center gap-2 mb-3 md:mb-4">
                        <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-sm font-bold">我</div>
                        <div>
                          <span className="text-xs md:text-sm font-semibold text-slate-800 dark:text-slate-200">博主</span>
                          <span className="text-[10px] text-slate-400 ml-2">{relativeTime(chatter.createTime || "")}</span>
                        </div>
                      </div>
                      <p className="text-xs md:text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{chatter.content}</p>
                      {chatter.mood && (
                        <div className="mt-2 inline-block text-[10px] md:text-xs px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400">{chatter.mood}</div>
                      )}
                    </div>

                    {images.length > 0 && (
                      <div className="px-4 md:px-5 pb-3">
                        <div className={`grid gap-1.5 ${images.length <= 2 ? "grid-cols-2" : "grid-cols-3"}`}>
                          {images.map((img, i) => (
                            <div key={i} className="relative rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-700 aspect-square">
                              <img src={img} alt="" className="w-full h-full object-cover" loading="lazy" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Giscus 评论区 */}
                    <div className="border-t border-slate-200/50 dark:border-white/5">
                      <div className="px-4 md:px-5 py-3">
                        <Giscus term={`moments-${chatter.id}`} />
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Backdrop */}
      <AnimatePresence>
        {expandedId !== null && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setExpandedId(null)} className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40" />
        )}
      </AnimatePresence>
    </div>
  );
}
