"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";

export default function GitHubCallbackPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const nickname = params.get("nickname") || "GitHub User";
    const username = params.get("username") || nickname;
    const avatar = params.get("avatar") || "";
    const userId = Number(params.get("id") || "0");

    if (token) {
      setAuth(token, {
        id: userId,
        username,
        nickname: nickname !== username ? nickname : undefined,
        avatar: avatar || undefined,
      });
      router.replace("/");
    } else {
      router.replace("/auth/login");
    }
  }, [router, setAuth]);

  return (
    <div className="flex items-center justify-center py-24">
      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
