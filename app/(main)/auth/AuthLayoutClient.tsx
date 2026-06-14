"use client";

import { useEffect, useState } from "react";

export default function AuthLayoutClient({ children }: { children: React.ReactNode }) {
  const [isStatic, setIsStatic] = useState(false);

  useEffect(() => {
    setIsStatic(process.env.NEXT_PUBLIC_IS_STATIC === "true");
  }, []);

  if (isStatic) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-8 text-center">
        <h1 className="text-2xl font-black text-slate-800 dark:text-white">认证页面不可用</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md">
          认证功能仅在本地开发环境中可用。请通过 Docker 或 dev 模式启动应用后访问。
        </p>
      </div>
    );
  }

  return children;
}
