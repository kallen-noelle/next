"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { siteConfig } from "@/lib/siteConfig";
import { useAuthStore } from "@/stores/authStore";
import { useRouter } from "next/navigation";
import ThemeToggle from "@/app/_components/common/ThemeToggle";
import FullscreenToggle from "@/app/_components/common/FullscreenToggle";

const NAV_ITEMS = [
  { name: "Home", href: "/" },
  { name: "Articles", href: "/article" },
  { name: "Projects", href: "/project" },
  { name: "Literature", href: "/literature" },
  { name: "Timeline", href: "/timeline" },
  { name: "Friends", href: "/friends" },
  { name: "About", href: "/about" },
];

export default function Navbar() {
  const [showNav, setShowNav] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const pathname = usePathname();
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const router = useRouter();
  const [isStatic, setIsStatic] = useState(true);

  useEffect(() => {
    setIsStatic(window.location.pathname.startsWith("/next"));
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 80) {
        setShowNav(false);
      } else {
        setShowNav(true);
      }
      setLastScrollY(currentScrollY);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  return (
    <header
      className={`hidden md:block w-full fixed top-0 left-0 right-0 z-50 transition-all duration-500 border-b ${
        showNav ? "translate-y-0" : "-translate-y-full"
      } bg-white/40 dark:bg-slate-900/50 backdrop-blur-xl border-white/20 dark:border-white/5 shadow-sm`}
    >
      <div className="w-[90%] max-w-6xl mx-auto h-16 flex items-center justify-between px-4 sm:px-[30px] box-border">
        <Link
          href="/"
          className="text-xl font-black text-slate-800 dark:text-white tracking-tighter hover:text-indigo-600 dark:hover:text-indigo-400 transition-all duration-300"
        >
          {siteConfig.navTitle}
          <span className="text-indigo-500 mx-1">{siteConfig.navSuffix}</span>
          {siteConfig.navAfter}
        </Link>

        <nav className="flex gap-6 text-sm font-bold items-center">
          {NAV_ITEMS.map((link) => {
            const isActive = pathname === link.href || pathname === `${link.href}/`;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative py-1 transition-colors ${
                  isActive
                    ? "text-indigo-600 dark:text-indigo-400"
                    : "text-slate-700 dark:text-slate-200 hover:text-indigo-600"
                }`}
              >
                {link.name}
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-indigo-500 rounded-full animate-pulse" />
                )}
              </Link>
            );
          })}

          {/* Auth */}
          {isLoggedIn ? (
            <div className="flex items-center gap-2 ml-2">
              {!isStatic && (
                <Link
                  href="/admin"
                  className="text-xs text-indigo-500 hover:text-indigo-400 transition-colors border-r border-slate-300 dark:border-slate-600 pr-2 mr-1"
                >
                  Admin
                </Link>
              )}
              <span className="text-xs text-slate-500">
                {user?.nickname || user?.username || "User"}
              </span>
              <button
                onClick={logout}
                className="text-xs text-slate-400 hover:text-red-500 transition-colors border-l border-slate-300 dark:border-slate-600 pl-2"
              >
                Sign Out
              </button>
            </div>
          ) : !isStatic && (
            <button
              onClick={() => router.push("/auth/login")}
              className="glass-btn !text-xs !py-1 !px-3 ml-2"
            >
              Sign In
            </button>
          )}
        </nav>

        <ThemeToggle />
        <FullscreenToggle />
      </div>
    </header>
  );
}
