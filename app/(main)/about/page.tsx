"use client";

import { useState, useEffect } from "react";
import type { About } from "@/lib/types";
import { get } from "@/lib/api/about";
import ArticleContent from "@/app/_components/article/ArticleContent";
import Loading from "@/app/_components/common/Loading";

export default function AboutPage() {
  const [about, setAbout] = useState<About | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    get().then(setAbout).catch(() => setAbout(null)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="py-24"><Loading /></div>;
  if (!about) return <div className="text-center py-24 text-slate-400">About page not configured yet.</div>;

  let socialLinks: { name: string; url: string }[] = [];
  try { socialLinks = JSON.parse(about.socialLinks || "[]"); } catch {}

  return (
    <>
      <h1 className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white mb-6">About</h1>

      <div className="glass-card p-8 mb-8">
        <ArticleContent content={about.content || ""} />
      </div>

      {(about.contactEmail || about.githubUrl || socialLinks.length > 0) && (
        <div className="glass-card p-6">
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-4">Contact & Links</h3>
          <div className="flex flex-wrap gap-3">
            {about.contactEmail && (
              <a href={`mailto:${about.contactEmail}`} className="glass-btn text-sm">
                {about.contactEmail}
              </a>
            )}
            {about.githubUrl && (
              <a href={about.githubUrl} target="_blank" rel="noreferrer" className="glass-btn text-sm">
                GitHub
              </a>
            )}
            {socialLinks.map((link) => (
              <a key={link.name} href={link.url} target="_blank" rel="noreferrer" className="glass-btn text-sm">
                {link.name}
              </a>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
