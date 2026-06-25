"use client";

import { useState, useEffect } from "react";
import type { FriendLink } from "@/lib/types";

interface FriendLinkData {
  rows: FriendLink[];
  total: number;
}

const BottleIcon = ({ name }: { name: string }) => (
  <svg width="58" height="93" viewBox="0 0 120 192" fill="none">
    <defs>
      <linearGradient id="bg" x1="30" y1="65" x2="90" y2="172" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#e0f2fe" stopOpacity="0.25" />
        <stop offset="25%" stopColor="#bae6fd" stopOpacity="0.18" />
        <stop offset="50%" stopColor="#7dd3fc" stopOpacity="0.12" />
        <stop offset="80%" stopColor="#38bdf8" stopOpacity="0.18" />
        <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.25" />
      </linearGradient>
      <linearGradient id="wt" x1="30" y1="118" x2="90" y2="168" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.35" />
        <stop offset="40%" stopColor="#0ea5e9" stopOpacity="0.5" />
        <stop offset="100%" stopColor="#0284c7" stopOpacity="0.6" />
      </linearGradient>
      <linearGradient id="bm" x1="44" y1="58" x2="76" y2="72" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#e0f2fe" stopOpacity="0.35" />
        <stop offset="100%" stopColor="#bae6fd" stopOpacity="0.2" />
      </linearGradient>
      <linearGradient id="ck" x1="42" y1="36" x2="78" y2="60" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#e8c888" />
        <stop offset="30%" stopColor="#d4a056" />
        <stop offset="70%" stopColor="#c49046" />
        <stop offset="100%" stopColor="#a87838" />
      </linearGradient>
      <linearGradient id="sc" x1="0" y1="0" x2="24" y2="16" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#fef9ef" />
        <stop offset="100%" stopColor="#fde68a" />
      </linearGradient>
      <radialGradient id="wx" cx="50%" cy="40%" r="50%">
        <stop offset="0%" stopColor="#f87171" />
        <stop offset="60%" stopColor="#dc2626" />
        <stop offset="100%" stopColor="#991b1b" />
      </radialGradient>
    </defs>
    <ellipse cx="60" cy="176" rx="30" ry="5" fill="rgba(0,0,0,0.1)" />
    <path d="M38 68 C38 68 28 88 28 118 C28 155 40 172 60 172 C80 172 92 155 92 118 C92 88 82 68 82 68" fill="url(#bg)" stroke="rgba(148,163,184,0.35)" strokeWidth="1.2" />
    <path d="M33 118 C33 118 31 134 36 148 C42 160 50 168 60 168 C70 168 78 160 84 148 C89 134 87 118 87 118 Z" fill="url(#wt)" />
    <path d="M35 120 Q48 116 60 120 Q72 124 85 120" fill="none" stroke="rgba(56,189,248,0.25)" strokeWidth="0.8" />
    <path d="M36 123 Q50 119 62 123 Q74 127 84 123" fill="none" stroke="rgba(56,189,248,0.15)" strokeWidth="0.5" />
    <g transform="translate(47, 96) rotate(-12)">
      <rect x="0" y="0" width="26" height="18" rx="3" fill="url(#sc)" stroke="#d4a056" strokeWidth="0.6" />
      <line x1="4" y1="4" x2="22" y2="4" stroke="#c4956a" strokeWidth="0.5" opacity="0.7" />
      <line x1="4" y1="7" x2="18" y2="7" stroke="#c4956a" strokeWidth="0.5" opacity="0.6" />
      <line x1="4" y1="10" x2="20" y2="10" stroke="#c4956a" strokeWidth="0.5" opacity="0.5" />
      <line x1="4" y1="13" x2="14" y2="13" stroke="#c4956a" strokeWidth="0.5" opacity="0.4" />
      <circle cx="0" cy="9" r="3.5" fill="#e8c888" stroke="#c49046" strokeWidth="0.5" />
      <circle cx="0" cy="9" r="1.5" fill="#f5d98a" opacity="0.5" />
      <circle cx="26" cy="9" r="3.5" fill="#e8c888" stroke="#c49046" strokeWidth="0.5" />
      <circle cx="26" cy="9" r="1.5" fill="#f5d98a" opacity="0.5" />
    </g>
    <circle cx="60" cy="106" r="6" fill="url(#wx)" stroke="#991b1b" strokeWidth="0.5" opacity="0.85" />
    <text x="60" y="109" textAnchor="middle" fontSize="6" fill="#fef2f2" fontWeight="bold" opacity="0.8">♥</text>
    <rect x="44" y="56" width="32" height="14" rx="2" fill="url(#bm)" stroke="rgba(148,163,184,0.25)" strokeWidth="0.8" />
    <rect x="46" y="57" width="28" height="3" rx="1" fill="rgba(255,255,255,0.25)" />
    <rect x="41" y="34" width="38" height="24" rx="5" fill="url(#ck)" stroke="rgba(160,120,60,0.4)" strokeWidth="0.8" />
    <line x1="47" y1="38" x2="47" y2="54" stroke="rgba(140,100,50,0.2)" strokeWidth="0.5" />
    <line x1="53" y1="36" x2="53" y2="56" stroke="rgba(140,100,50,0.15)" strokeWidth="0.5" />
    <line x1="60" y1="37" x2="60" y2="55" stroke="rgba(140,100,50,0.2)" strokeWidth="0.5" />
    <line x1="67" y1="38" x2="67" y2="54" stroke="rgba(140,100,50,0.15)" strokeWidth="0.5" />
    <line x1="73" y1="39" x2="73" y2="53" stroke="rgba(140,100,50,0.12)" strokeWidth="0.5" />
    <rect x="44" y="36" width="20" height="4" rx="2" fill="rgba(255,255,255,0.15)" />
    <path d="M44 74 C44 74 40 96 40 118 C40 140 42 156 48 164" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M76 78 C76 78 78 100 78 120 C78 138 76 150 72 158" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" strokeLinecap="round" />
    <ellipse cx="60" cy="62" rx="12" ry="2" fill="rgba(255,255,255,0.15)" />
    <circle cx="50" cy="142" r="2.5" fill="rgba(255,255,255,0.25)" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
    <circle cx="70" cy="136" r="1.8" fill="rgba(255,255,255,0.2)" stroke="rgba(255,255,255,0.12)" strokeWidth="0.4" />
    <circle cx="56" cy="150" r="1.2" fill="rgba(255,255,255,0.18)" />
    <circle cx="64" cy="146" r="0.8" fill="rgba(255,255,255,0.15)" />
    <circle cx="46" cy="134" r="1.5" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.08)" strokeWidth="0.3" />
  </svg>
);

const BOTTLE_POSITIONS = [
  { left: 12, top: 18, rot: -55 },
  { left: 88, top: 15, rot: -12 },
  { left: 50, top: 12, rot: 8 },
  { left: 28, top: 42, rot: 35 },
  { left: 72, top: 38, rot: -25 },
  { left: 8, top: 72, rot: 18 },
  { left: 92, top: 68, rot: 42 },
  { left: 48, top: 55, rot: -8 },
  { left: 20, top: 88, rot: -45 },
  { left: 80, top: 85, rot: 28 },
];

export default function FriendsBoard() {
  const [friends, setFriends] = useState<FriendLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFriend, setSelectedFriend] = useState<FriendLink | null>(null);

  useEffect(() => {
    fetch("/data/friendLinks.json")
      .then((res) => res.json())
      .then((data: FriendLinkData) => {
        const published = (data.rows ?? []).filter((f) => f.isPublished !== 0);
        setFriends(published);
      })
      .catch((err) => {
        console.error("Failed to load friends:", err);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen">
      <style>{`
        @keyframes bottle-float {
          0%, 100% { transform: translateY(0) rotate(var(--rot)); }
          25% { transform: translateY(-8px) rotate(calc(var(--rot) + 1deg)); }
          75% { transform: translateY(5px) rotate(calc(var(--rot) - 1deg)); }
        }
        @keyframes bottle-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>

      <div className="flex items-center gap-2 md:gap-3 mb-1 md:mb-2">
        <svg className="w-5 h-5 md:w-7 md:h-7 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 3.128a4 4 0 0 1 0 7.744" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <circle cx="9" cy="7" r="4" />
        </svg>
        <h1 className="text-xl md:text-3xl font-bold text-slate-800 dark:text-slate-100">友链</h1>
      </div>
      <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 ml-7 md:ml-10">
        漂流瓶 · 来自远方的 {friends.length} 个朋友
      </p>

      <div className="relative select-none mt-8 md:mt-12" style={{ height: "600px" }}>
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : friends.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-slate-400 dark:text-slate-500">
              <p className="text-lg font-bold">暂无友链</p>
              <p className="text-sm mt-2">等待漂流瓶的到来...</p>
            </div>
          </div>
        ) : (
          friends.map((friend, index) => {
            const pos = BOTTLE_POSITIONS[index % BOTTLE_POSITIONS.length];
            return (
              <div
                key={friend.id ?? index}
                className="absolute cursor-pointer group"
                style={{
                  left: `${pos.left}%`,
                  top: `${pos.top}%`,
                  transform: "translate(-50%, -50%)",
                  "--rot": `${pos.rot}deg`,
                  animation: `bottle-float ${3.2 + index * 0.6}s ease-in-out infinite, bottle-fade-in 0.5s ease-out ${index * 0.1}s forwards`,
                  opacity: 0,
                } as React.CSSProperties}
                onClick={() => setSelectedFriend(friend)}
              >
                <BottleIcon name={friend.name} />
                <div className="absolute -bottom-4 md:-bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                  <span className="px-2 py-0.5 md:px-3 md:py-1 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-md text-[10px] md:text-xs font-bold text-slate-700 dark:text-slate-200 shadow-lg border border-white/40 dark:border-white/10">
                    {friend.name}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      <p className="text-center text-[10px] md:text-xs text-slate-400 mt-4 md:mt-6">
        点击漂流瓶查看朋友信息 · 欢迎交换友链
      </p>

      {selectedFriend && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setSelectedFriend(null)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-md rounded-3xl bg-gradient-to-br from-white/90 to-white/50 dark:from-slate-800/90 dark:to-slate-800/50 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedFriend(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/50 dark:bg-slate-700/50 hover:bg-white/70 dark:hover:bg-slate-600/50 transition-colors"
            >
              <svg className="w-5 h-5 text-slate-600 dark:text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="flex flex-col items-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-sky-500 via-indigo-500 to-purple-500 p-[3px] mb-4">
                <div className="w-full h-full rounded-full bg-white dark:bg-slate-900 overflow-hidden">
                  <img
                    src={selectedFriend.avatar || "/bg/1.jpg"}
                    alt={selectedFriend.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/bg/1.jpg";
                    }}
                  />
                </div>
              </div>

              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                {selectedFriend.name}
              </h3>

              {selectedFriend.description && (
                <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-4">
                  {selectedFriend.description}
                </p>
              )}

              <div className="flex items-center gap-2 text-sm text-slate-400 font-mono mb-6">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="truncate max-w-xs">
                  {selectedFriend.url.replace(/^https?:\/\//, "")}
                </span>
              </div>

              <a
                href={selectedFriend.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-bold shadow-lg shadow-sky-500/30 hover:shadow-xl hover:shadow-sky-500/40 transition-all"
              >
                访问站点
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
