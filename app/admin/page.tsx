"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { DashboardVO } from "@/lib/types";
import { get } from "@/lib/api/dashboard";
import { syncToGithub, type SyncProgress } from "@/lib/github-sync";

const STORAGE_KEY = "github_token";

export default function AdminDashboardPage() {
  const [dash, setDash] = useState<DashboardVO | null>(null);
  const [token, setToken] = useState("");
  const [savedToken, setSavedToken] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [progress, setProgress] = useState<SyncProgress | null>(null);
  const [result, setResult] = useState<"success" | "error" | null>(null);
  const [showTokenInput, setShowTokenInput] = useState(false);

  useEffect(() => {
    get().then(setDash).catch(() => {});
    const stored = localStorage.getItem(STORAGE_KEY) || "";
    setSavedToken(stored);
  }, []);

  const handleSaveToken = () => {
    localStorage.setItem(STORAGE_KEY, token);
    setSavedToken(token);
    setToken("");
    setShowTokenInput(false);
  };

  const handleClearToken = () => {
    localStorage.removeItem(STORAGE_KEY);
    setSavedToken("");
  };

  const handleSync = async () => {
    if (!savedToken) return;
    setSyncing(true);
    setResult(null);
    setProgress(null);

    const res = await syncToGithub(savedToken, (p) => setProgress(p));
    setResult(res.success ? "success" : "error");
    setSyncing(false);
  };

  // Mask token for display
  const masked = savedToken.length > 8
    ? savedToken.slice(0, 4) + "****" + savedToken.slice(-4)
    : "";

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

      {/* Sync to GitHub */}
      <h2 className="text-lg font-bold mt-10 mb-4 text-slate-700 dark:text-slate-300">
        Sync to GitHub
      </h2>
      <div className="glass-card p-5">
        {!savedToken || showTokenInput ? (
          <div className="flex flex-col gap-3">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Enter a GitHub Personal Access Token with <code className="text-indigo-500">Contents: write</code> scope for <code className="text-indigo-500">pc-Blog/next</code>.
            </p>
            <div className="flex gap-2">
              <input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="ghp_..."
                className="flex-1 px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={handleSaveToken}
                disabled={!token}
                className="px-4 py-2 text-sm font-bold rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white disabled:opacity-50 transition-colors"
              >
                Save
              </button>
            </div>
            {savedToken && (
              <button onClick={() => setShowTokenInput(false)} className="text-xs text-slate-400 hover:text-slate-600 self-start">
                Cancel
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3 text-sm">
              <span className="text-slate-500 dark:text-slate-400">Token:</span>
              <code className="text-xs text-slate-600 dark:text-slate-300">{masked}</code>
              <button
                onClick={() => setShowTokenInput(true)}
                className="text-xs text-indigo-500 hover:text-indigo-600"
              >
                Change
              </button>
              <button
                onClick={handleClearToken}
                className="text-xs text-red-400 hover:text-red-500"
              >
                Remove
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleSync}
                disabled={syncing}
                className="px-5 py-2.5 text-sm font-bold rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white disabled:opacity-50 transition-all duration-300 hover:scale-105 shadow-lg shadow-indigo-500/30"
              >
                {syncing ? "Syncing..." : "Sync to GitHub"}
              </button>

              {progress && (
                <span className="text-xs text-slate-500 dark:text-slate-400 animate-pulse">
                  {progress.message}
                </span>
              )}
            </div>

            {result === "success" && (
              <p className="text-xs text-emerald-500 font-medium">
                ✓ Sync complete! CI/CD is building the site.
              </p>
            )}
            {result === "error" && progress && (
              <p className="text-xs text-red-400 font-medium">
                ✗ {progress.message}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}