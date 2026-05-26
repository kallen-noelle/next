"use client";

import { useEffect, useState } from "react";
import GiscusLib from "@giscus/react";

const LIGHT_THEME = "https://cdn.jsdelivr.net/gh/pc-Blog/next@master/public/giscus-light.css?v=2";
const DARK_THEME = "https://cdn.jsdelivr.net/gh/pc-Blog/next@master/public/giscus-dark.css?v=2";

export default function Giscus() {
  const [theme, setTheme] = useState<string | null>(null);

  useEffect(() => {
    function resolveTheme(): string {
      const stored = window.localStorage.getItem("blog-theme");
      // default to dark (matches blog ThemeProvider: stored === null → dark)
      const isDark = stored === null || stored === "dark";
      return isDark ? DARK_THEME : LIGHT_THEME;
    }

    setTheme(resolveTheme());

    const handler = () => setTheme(resolveTheme());
    window.addEventListener("theme-changed", handler);
    return () => window.removeEventListener("theme-changed", handler);
  }, []);

  // wait until theme is resolved (avoids wrong initial url)
  if (theme === null) {
    return (
      <div className="w-full mt-8 relative">
        <div className="giscus-wrapper relative z-10 pt-6 border-t border-slate-200 dark:border-slate-700" />
      </div>
    );
  }

  return (
    <div className="w-full mt-8 relative">
      <div className="giscus-wrapper relative z-10 pt-6 border-t border-slate-200 dark:border-slate-700">
        <GiscusLib
          repo="pc-Blog/next"
          repoId="R_kgDOSk99gw"
          category="Announcements"
          categoryId="DIC_kwDOSk99g84C9uoJ"
          mapping="pathname"
          strict="0"
          reactionsEnabled="1"
          emitMetadata="0"
          inputPosition="top"
          theme={theme}
          lang="zh-CN"
        />
      </div>
    </div>
  );
}
