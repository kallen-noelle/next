"use client";

import { useEffect, useState } from "react";
import GiscusLib from "@giscus/react";
import { siteConfig } from "@/lib/siteConfig";

const GH_CDN = `https://cdn.jsdelivr.net/gh/${siteConfig.repo}@master/public`;

export default function Giscus({ term }: { term?: string }) {
  const [theme, setTheme] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    function resolveTheme(): string {
      const stored = window.localStorage.getItem("blog-theme");
      const isDark = stored === null || stored === "dark";
      return isDark ? `${GH_CDN}/giscus-dark.css?v=2` : `${GH_CDN}/giscus-light.css?v=2`;
    }
    setTheme(resolveTheme());
    const handler = () => setTheme(resolveTheme());
    window.addEventListener("theme-changed", handler);
    return () => window.removeEventListener("theme-changed", handler);
  }, []);

  // Force remount when term changes
  useEffect(() => {
    setMounted(false);
    const t = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(t);
  }, [term]);

  if (theme === null || !mounted) {
    return (
      <div className="w-full mt-8 relative">
        <div className="giscus-wrapper relative z-10 pt-6" style={{ borderTop: "1px solid rgba(148,163,184,0.3)" }} />
      </div>
    );
  }

  return (
    <div className="w-full mt-3 relative">
      <div className="giscus-wrapper relative z-10">
        <GiscusLib
          repo={siteConfig.repo as `${string}/${string}`}
          repoId={siteConfig.repoId}
          category={siteConfig.giscusCategory}
          categoryId={siteConfig.giscusCategoryId}
          mapping={term ? "specific" : "pathname"}
          term={term}
          strict="0"
          reactionsEnabled="1"
          emitMetadata="1"
          inputPosition="top"
          theme={theme}
          lang="zh-CN"
        />
      </div>
    </div>
  );
}
