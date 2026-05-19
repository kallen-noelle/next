"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { DashboardVO } from "@/lib/types";
import { get } from "@/lib/api/dashboard";

export default function AdminDashboardPage() {
  const [dash, setDash] = useState<DashboardVO | null>(null);

  useEffect(() => {
    get().then(setDash).catch(() => {});
  }, []);

  if (!dash) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-black text-slate-900 dark:text-white">Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        {[
          { label: "Articles", value: dash.articleCount, href: "/admin/article", color: "text-indigo-500" },
          { label: "Projects", value: dash.projectCount, href: "/admin/project", color: "text-purple-500" },
          { label: "Skills", value: dash.skillCount, href: "/admin/skill", color: "text-pink-500" },
          { label: "Comments", value: dash.commentCount, href: "#", color: "text-emerald-500" },
          { label: "Total Views", value: dash.totalViews, href: "#", color: "text-amber-500" },
          { label: "Timeline", value: dash.timelineCount, href: "/admin/timeline", color: "text-cyan-500" },
        ].map((s) => (
          <Link key={s.label} href={s.href} className="glass-card p-4 hover:scale-[1.02] transition-transform">
            <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
            <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">{s.label}</div>
          </Link>
        ))}
      </div>

      <h2 className="text-lg font-bold mt-10 mb-4 text-slate-700 dark:text-slate-300">Quick Actions</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "New Article", href: "/admin/article/new" },
          { label: "New Project", href: "/admin/project/new" },
          { label: "Upload Media", href: "/admin/media" },
          { label: "Edit About", href: "/admin/about" },
        ].map((a) => (
          <Link key={a.label} href={a.href} className="glass-card p-4 text-center text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-indigo-500 transition-colors">
            {a.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
