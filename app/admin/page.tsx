"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { DashboardVO } from "@/lib/types";
import { get } from "@/lib/api/dashboard";
import { syncJson, syncMedia, syncMusic, generateSyncZip, type SyncProgress } from "@/lib/github-sync";

const STORAGE_KEY = "github_token";

interface SyncState {
  syncing: boolean;
  progress: SyncProgress | null;
  logs: string[];
  result: "success" | "error" | null;
}

function SyncPanel({ label, syncing, progress, logs, result, onSync }: {
  label: string;
  syncing: boolean;
  progress: SyncProgress | null;
  logs: string[];
  result: "success" | "error" | null;
  onSync: () => void;
}) {
  return (
    <div className="border-t border-slate-200 dark:border-slate-700 pt-4 first:border-t-0 first:pt-0">
      <div className="flex items-center gap-3">
        <button onClick={onSync} disabled={syncing}
          className="px-4 py-2 text-sm font-bold rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white disabled:opacity-50 transition-all"
        >
          {syncing ? "Syncing..." : `Sync ${label}`}
        </button>
        {progress && (
          <span className="text-xs text-slate-500 dark:text-slate-400 animate-pulse">{progress.message}</span>
        )}
      </div>
      {logs.length > 0 && (
        <div className="mt-2 max-h-40 overflow-y-auto bg-slate-900/80 rounded-lg p-2 text-[10px] font-mono leading-relaxed">
          {logs.map((line, i) => (
            <div key={i} className={`${line.includes("OK") ? "text-emerald-400" : line.includes("FAIL") ? "text-red-400" : "text-slate-300"}`}>
              {line}
            </div>
          ))}
        </div>
      )}
      {result === "success" && <p className="text-xs text-emerald-500 font-medium mt-1">✓ Sync complete!</p>}
      {result === "error" && progress && <p className="text-xs text-red-400 font-medium mt-1">✗ {progress.message}</p>}
    </div>
  );
}

export default function AdminDashboardPage() {
  const [dash, setDash] = useState<DashboardVO | null>(null);
  const [token, setToken] = useState("");
  const [savedToken, setSavedToken] = useState("");
  const [jsonSync, setJsonSync] = useState<SyncState>({ syncing: false, progress: null, logs: [], result: null });
  const [mediaSync, setMediaSync] = useState<SyncState>({ syncing: false, progress: null, logs: [], result: null });
  const [musicSync, setMusicSync] = useState<SyncState>({ syncing: false, progress: null, logs: [], result: null });
  const [manualState, setManualState] = useState({ generating: false, progress: null as SyncProgress | null, logs: [] as string[] });
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

  const handleJsonSync = async () => {
    if (!savedToken) return;
    setJsonSync({ syncing: true, progress: null, logs: [], result: null });
    const res = await syncJson(savedToken, (p) => {
      setJsonSync((prev) => ({
        ...prev,
        progress: p,
        logs: p.log ? [...prev.logs, p.log] : prev.logs,
      }));
    });
    setJsonSync((prev) => ({
      ...prev,
      syncing: false,
      result: res.success ? "success" : "error",
      logs: [...prev.logs, res.success ? "✓ Sync complete!" : "✗ Sync failed!"],
    }));
  };

  const handleMediaSync = async () => {
    if (!savedToken) return;
    setMediaSync({ syncing: true, progress: null, logs: [], result: null });
    const res = await syncMedia(savedToken, (p) => {
      setMediaSync((prev) => ({
        ...prev,
        progress: p,
        logs: p.log ? [...prev.logs, p.log] : prev.logs,
      }));
    });
    setMediaSync((prev) => ({
      ...prev,
      syncing: false,
      result: res.success ? "success" : "error",
      logs: [...prev.logs, res.success ? "✓ Sync complete!" : "✗ Sync failed!"],
    }));
  };

  const handleMusicSync = async () => {
    if (!savedToken) return;
    setMusicSync({ syncing: true, progress: null, logs: [], result: null });
    const res = await syncMusic(savedToken, (p) => {
      setMusicSync((prev) => ({
        ...prev,
        progress: p,
        logs: p.log ? [...prev.logs, p.log] : prev.logs,
      }));
    });
    setMusicSync((prev) => ({
      ...prev,
      syncing: false,
      result: res.success ? "success" : "error",
      logs: [...prev.logs, res.success ? "✓ Sync complete!" : "✗ Sync failed!"],
    }));
  };

  const handleManualSync = async () => {
    setManualState({ generating: true, progress: null, logs: [] });
    try {
      const { blob, name, batContent } = await generateSyncZip((p) => {
        setManualState((prev) => ({
          ...prev,
          progress: p,
          logs: p.log ? [...prev.logs, p.log] : prev.logs,
        }));
      });

      // Download ZIP
      const zipUrl = URL.createObjectURL(blob);
      const zipLink = document.createElement("a");
      zipLink.href = zipUrl;
      zipLink.download = name;
      zipLink.click();
      URL.revokeObjectURL(zipUrl);

      // Download BAT
      const batBlob = new Blob([batContent], { type: "text/plain;charset=utf-8" });
      const batUrl = URL.createObjectURL(batBlob);
      const batLink = document.createElement("a");
      batLink.href = batUrl;
      batLink.download = "sync.bat";
      batLink.click();
      URL.revokeObjectURL(batUrl);

      setManualState((prev) => ({
        ...prev,
        generating: false,
        logs: [...prev.logs, `✓ ${name} 已下载`],
      }));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setManualState((prev) => ({
        ...prev,
        generating: false,
        progress: { stage: "error", message: msg },
        logs: [...prev.logs, `✗ ${msg}`],
      }));
    }
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

            <div className="flex flex-col gap-4 mt-2">
              <SyncPanel label="JSON Data" onSync={handleJsonSync} syncing={jsonSync.syncing} progress={jsonSync.progress} logs={jsonSync.logs} result={jsonSync.result} />
              <SyncPanel label="Media" onSync={handleMediaSync} syncing={mediaSync.syncing} progress={mediaSync.progress} logs={mediaSync.logs} result={mediaSync.result} />
              <SyncPanel label="Music" onSync={handleMusicSync} syncing={musicSync.syncing} progress={musicSync.progress} logs={musicSync.logs} result={musicSync.result} />
            </div>

            <div className="border-t border-slate-200 dark:border-slate-700 pt-4 mt-4">
              <div className="flex items-center gap-3">
                <button onClick={handleManualSync} disabled={manualState.generating}
                  className="px-4 py-2 text-sm font-bold rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white disabled:opacity-50 transition-all"
                >
                  {manualState.generating ? "Generating..." : "Manual Sync"}
                </button>
                {manualState.progress && (
                  <span className="text-xs text-slate-500 dark:text-slate-400 animate-pulse">{manualState.progress.message}</span>
                )}
              </div>
              {manualState.logs.length > 0 && (
                <div className="mt-2 max-h-32 overflow-y-auto bg-slate-900/80 rounded-lg p-2 text-[10px] font-mono leading-relaxed">
                  {manualState.logs.map((line, i) => (
                    <div key={i} className={`${line.startsWith("✓") ? "text-emerald-400" : line.startsWith("✗") ? "text-red-400" : "text-slate-300"}`}>{line}</div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
