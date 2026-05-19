"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { siteConfig } from "@/lib/siteConfig";
import type { DashboardVO } from "@/lib/types";
import { get } from "@/lib/api/dashboard";
import ThemeToggleBlock from "@/app/_components/common/ThemeToggle";
import MusicPlayer from "@/app/_components/layout/MusicPlayer";

export default function Home() {
  const [dash, setDash] = useState<DashboardVO | null>(null);

  useEffect(() => {
    get().then(setDash).catch(() => {});
  }, []);

  return (
    <div className="flex flex-col gap-6 w-full mt-6">
      {/* Row 1: Profile Card + Player */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
        {/* ProfileCard — 7 cols */}
        <Link
          href="/about"
          className="col-span-1 lg:col-span-7 rounded-3xl bg-white/40 dark:bg-slate-800/50 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-xl p-5 sm:p-6 md:p-8 flex flex-col justify-between transition-all duration-700 hover:scale-[1.01] group relative overflow-hidden min-h-[220px]"
        >
          <div className="flex items-start justify-between relative z-10">
            <div className="flex items-center gap-4 md:gap-6 w-full">
              <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-xl md:rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 p-1 shadow-lg flex-shrink-0 transition-transform duration-500 group-hover:rotate-3">
                <img src={siteConfig.avatarUrl} alt="" className="w-full h-full rounded-lg md:rounded-xl object-cover bg-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 dark:text-white mb-1 tracking-tighter">{siteConfig.authorName}</h1>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">{siteConfig.bio}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between mt-6 md:mt-8 relative z-10">
            <div className="flex gap-2 sm:gap-6">
              {[
                { count: dash?.articleCount ?? "—", label: "Articles", color: "text-indigo-600 dark:text-indigo-400" },
                { count: dash?.projectCount ?? "—", label: "Projects", color: "text-purple-600 dark:text-purple-400" },
                { count: dash?.skillCount ?? "—", label: "Skills", color: "text-pink-600 dark:text-pink-400" },
              ].map((stat) => (
                <div key={stat.label} className="text-center group/stat px-2">
                  <div className={`text-xl md:text-2xl font-black ${stat.color} transition-transform group-hover/stat:scale-110`}>{stat.count}</div>
                  <div className="text-[9px] md:text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-0.5">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </Link>

        {/* Player — 5 cols */}
        <div className="col-span-1 lg:col-span-5">
          <MusicPlayer />
        </div>
      </div>

      {/* Row 2: Article Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full">
        <Link href="/article" className="rounded-3xl bg-white/40 dark:bg-slate-800/50 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-xl p-6 transition-all duration-700 hover:scale-[1.02] group">
          <span className="inline-block px-2 py-0.5 text-[10px] font-bold rounded-md bg-indigo-500/80 text-white backdrop-blur-lg mb-3">Read</span>
          <h3 className="text-lg font-black text-slate-900 dark:text-white group-hover:-translate-y-0.5 transition-transform">Articles</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Tech &amp; Research</p>
        </Link>
        <Link href="/project" className="rounded-3xl bg-white/40 dark:bg-slate-800/50 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-xl p-6 transition-all duration-700 hover:scale-[1.02] group">
          <span className="inline-block px-2 py-0.5 text-[10px] font-bold rounded-md bg-purple-500/80 text-white backdrop-blur-lg mb-3">Build</span>
          <h3 className="text-lg font-black text-slate-900 dark:text-white group-hover:-translate-y-0.5 transition-transform">Projects</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Code &amp; Portfolio</p>
        </Link>
        <Link href="/timeline" className="rounded-3xl bg-white/40 dark:bg-slate-800/50 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-xl p-6 transition-all duration-700 hover:scale-[1.02] group">
          <span className="inline-block px-2 py-0.5 text-[10px] font-bold rounded-md bg-pink-500/80 text-white backdrop-blur-lg mb-3">Learn</span>
          <h3 className="text-lg font-black text-slate-900 dark:text-white group-hover:-translate-y-0.5 transition-transform">Timeline</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Learning Path</p>
        </Link>
      </div>

      {/* Row 3: Dashboard stats + Theme toggle */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
        {/* Stats — 8 cols */}
        <div className="col-span-1 lg:col-span-8">
          {dash && (
            <div className="rounded-3xl bg-white/40 dark:bg-slate-800/50 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-xl p-6 flex items-center gap-8 flex-wrap">
              {[
                { v: dash.articleCount, l: "Articles" },
                { v: dash.totalViews, l: "Total Views" },
                { v: dash.commentCount, l: "Comments" },
                { v: dash.timelineCount, l: "Milestones" },
              ].map((s) => (
                <div key={s.l}>
                  <span className="font-mono text-2xl font-black text-indigo-500">{s.v}</span>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{s.l}</p>
                </div>
              ))}
            </div>
          )}
        </div>
        {/* Theme toggle — 4 cols */}
        <div className="col-span-1 lg:col-span-4 min-h-[80px]">
          <ThemeToggleBlock />
        </div>
      </div>
    </div>
  );
}
