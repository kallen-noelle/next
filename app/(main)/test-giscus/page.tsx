"use client";

import { useEffect, useState } from "react";
import { siteConfig } from "@/lib/siteConfig";

const [GH_OWNER, GH_REPO] = siteConfig.repo.split("/");
const GITHUB_GRAPHQL = "https://api.github.com/graphql";
const QUERY = `query {
  repository(owner: "${GH_OWNER}", name: "${GH_REPO}") {
    discussions(first: 50, categoryId: siteConfig.giscusCategoryId) {
      totalCount
      nodes { number title comments { totalCount } }
    }
  }
}`;

export default function GitHubCommentsTestPage() {
  const [total, setTotal] = useState<number | null>(null);
  const [discussionCount, setDiscussionCount] = useState<number | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTotal = async () => {
    setLoading(true);
    setLog((prev) => [...prev.slice(-20), `[${new Date().toLocaleTimeString()}] fetching...`]);
    try {
      const res = await fetch(GITHUB_GRAPHQL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: QUERY }),
      });
      const json = await res.json();
      if (json.data?.repository?.discussions) {
        const d = json.data.repository.discussions;
        setDiscussionCount(d.totalCount);
        const sum = d.nodes.reduce((acc: number, n: { comments: { totalCount: number } }) => acc + n.comments.totalCount, 0);
        setTotal(sum);
        setLog((prev) => [...prev.slice(-20), `[${new Date().toLocaleTimeString()}] OK: ${d.totalCount} discussions, ${sum} total comments`]);
      } else {
        setLog((prev) => [...prev.slice(-20), `[${new Date().toLocaleTimeString()}] error: ${JSON.stringify(json)}`]);
      }
    } catch (e) {
      setLog((prev) => [...prev.slice(-20), `[${new Date().toLocaleTimeString()}] fetch failed: ${(e as Error).message}`]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-10 px-4 space-y-6">
      <h1 className="text-2xl font-bold">GitHub Discussions Total Comments Test</h1>

      <div className="p-4 rounded-lg bg-slate-100 dark:bg-slate-800 text-lg font-bold space-y-2">
        <div>Discussions: <span className="text-indigo-500">{discussionCount ?? "—"}</span></div>
        <div>Total comments: <span className="text-indigo-500">{total ?? "—"}</span></div>
        <button
          onClick={fetchTotal}
          disabled={loading}
          className="mt-2 px-4 py-2 text-sm rounded-lg bg-indigo-500 text-white font-bold hover:bg-indigo-600 disabled:opacity-50"
        >
          {loading ? "Loading..." : "Fetch from GitHub API"}
        </button>
      </div>

      {/* Log */}
      <div className="p-4 rounded-lg bg-slate-100 dark:bg-slate-800">
        <h2 className="font-bold mb-2">Log:</h2>
        <div className="bg-black/80 text-green-400 p-3 rounded font-mono text-xs max-h-48 overflow-y-auto whitespace-pre-wrap">
          {log.length === 0 ? <span className="text-slate-500">Click button to fetch</span> : log.map((m, i) => <div key={i}>{m}</div>)}
        </div>
      </div>
    </div>
  );
}
