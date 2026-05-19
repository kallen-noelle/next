"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/admin" },
  { label: "Articles", href: "/admin/article" },
  { label: "Projects", href: "/admin/project" },
  { label: "Timeline", href: "/admin/timeline" },
  { label: "Skills", href: "/admin/skill" },
  { label: "Categories", href: "/admin/category" },
  { label: "Tags", href: "/admin/tag" },
  { label: "Media", href: "/admin/media" },
  { label: "About", href: "/admin/about" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const router = useRouter();

  const hasToken = typeof window !== "undefined" && !!localStorage.getItem("token");

  useEffect(() => {
    if (!hasToken) router.replace("/auth/login");
  }, [hasToken, router]);

  if (!hasToken) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <aside className="w-56 glass-card !rounded-none border-r border-slate-200 dark:border-slate-700 p-6 flex-shrink-0">
        <Link href="/admin" className="text-lg font-black text-slate-900 dark:text-white font-[family-name:var(--font-geist-sans)] block mb-6">Admin</Link>
        <nav className="flex flex-col gap-0.5 text-sm">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-2 rounded-lg transition-colors ${
                  active
                    ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-bold"
                    : "text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white/50"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <main className="flex-1 p-8 overflow-auto">{children}</main>
    </div>
  );
}
