"use client";

import { useState, useEffect, useMemo } from "react";
import type { About } from "@/lib/types";
import { get } from "@/lib/api/about";
import ArticleProse from "@/app/_components/article/ArticleProse";
import Loading from "@/app/_components/common/Loading";
import { siteConfig } from "@/lib/siteConfig";

export default function AboutPage() {
  const [about, setAbout] = useState<About | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    get().then(setAbout).catch(() => setAbout(null)).finally(() => setLoading(false));
  }, []);

  const coverImage = useMemo(() => siteConfig.bgImages[Math.floor(Math.random() * siteConfig.bgImages.length)], []);

  if (loading) return <div className="py-24"><Loading /></div>;

  let socialLinks: { name: string; url: string }[] = [];
  try { socialLinks = JSON.parse(about?.socialLinks || "[]"); } catch {}

  return (
    <div className="min-h-screen relative pb-20">
      <div className="max-w-3xl mx-auto">
        <article className="bg-white/60 dark:bg-slate-800/50 backdrop-blur-xl rounded-[40px] shadow-2xl border border-white/40 dark:border-white/10 overflow-hidden">
          {/* Cover image */}
          <div className="relative h-48 md:h-64 overflow-hidden">
            <img src={coverImage} alt="" className="w-full h-full object-cover transition duration-700 hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          </div>

          <div className="relative px-6 md:px-12 pb-10">
            {/* Avatar overlapping */}
            <div className="flex justify-center -mt-12 md:-mt-16 mb-4">
              <div className="relative w-24 h-24 md:w-28 md:h-28">
                <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-60 blur-[3px]" />
                <div className="relative w-full h-full rounded-full p-1 bg-white dark:bg-slate-900 shadow-xl">
                  <img src={siteConfig.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                </div>
              </div>
            </div>

            <div className="text-center mb-8">
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white mb-2">About</h1>
              {about ? (
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Hello World, I&apos;m {siteConfig.authorName}</p>
              ) : (
                <p className="text-sm text-slate-400">About page not configured yet.</p>
              )}
            </div>

            {/* Content */}
            {about?.content && (
              <div className="mb-8">
                <ArticleProse content={about.content} />
              </div>
            )}

            {/* Contact & Links */}
            {(about?.contactEmail || about?.githubUrl || socialLinks.length > 0) && (
              <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-4">Contact & Links</h3>
                <div className="flex flex-wrap gap-2">
                  {about?.contactEmail && (
                    <a href={`mailto:${about.contactEmail}`} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-sm font-medium hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                      {about.contactEmail}
                    </a>
                  )}
                  {about?.githubUrl && (
                    <a href={about.githubUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-sm font-medium hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.379.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.418 22 12c0-5.523-4.477-10-10-10z" /></svg>
                      GitHub
                    </a>
                  )}
                  {socialLinks.map((link) => (
                    <a key={link.name} href={link.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-sm font-medium hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                      {link.name}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </article>
      </div>
    </div>
  );
}
