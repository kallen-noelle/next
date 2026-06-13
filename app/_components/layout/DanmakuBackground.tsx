"use client";

import { useEffect, useState } from "react";
import { siteConfig } from "@/lib/siteConfig";

interface Danmaku {
  id: number;
  text: string;
  top: number;
  duration: number;
  delay: number;
}

export default function DanmakuBackground() {
  const [items, setItems] = useState<Danmaku[]>([]);

  const danmakuList = [
    // Greetings & welcome
    "Hello!",
    "Welcome to my blog~",
    "Hi there! 👋",
    "Glad to see you 🎉",
    "Long time no see~",
    "Hello, friend!",
    "Welcome back!",

    // Tech related
    "Code. Debug. Repeat.",
    "Keep coding, keep curious.",
    "TypeScript is love ❤️",
    "Next.js rocks!",
    "Bug? No way.",
    "Refactoring... ✨",
    "PR welcome!",
    "Open source spirit",
    "Web dev daily",

    // Encouragement & thoughts
    "Keep writing ✍️",
    "Progress every day",
    "Stay curious.",
    "Sharing makes knowledge valuable",
    "Blog is a witness of growth",
    "Never stop thinking",
    "Reflect and grow",

    // Fun & life
    "Bubble tea is fuel 🧋",
    "Coffee ☕ + Code 💻",
    "Another energetic day",
    "Slacking off... shh~",
    "I'll rest after this post!",
    "Interesting bug 🤔",
    "Keyboard clacking ⌨️",

    // Blog specific
    "Thanks for reading 🙏",
    "Comments are welcome",
    "Hit like before you go~",
    "Bookmark and don't lose it",
    "Share if you like it",
    "See you in the comments!",

    // Easter eggs
    "You found the danmaku 😄",
    "This line appears randomly",
    "Congratulations, you caught a bullet comment",
    "🎈 Floating message",
    "✨ Sparkling sentence"
  ]

  useEffect(() => {
    if (!danmakuList.length) return;
    setItems(
      Array.from({ length: 15 }, (_, i) => ({
        id: i,
        text: danmakuList[i % danmakuList.length],
        top: 10 + Math.random() * 80,
        duration: 25 + Math.random() * 20,
        delay: Math.random() * 20,
      }))
    );
  }, []);

  if (!items.length) return null;

  return (
    <div className="fixed top-28 h-[30vh] left-0 right-0 overflow-hidden pointer-events-none z-0">
      <style>{`
        @keyframes float-left {
          from { right: -100%; transform: translateX(100%); }
          to { right: 100%; transform: translateX(-100%); }
        }
      `}</style>
      {items.map((d) => (
        <div
          key={d.id}
          className="absolute whitespace-nowrap text-white/30 dark:text-white/10 font-bold text-lg tracking-wider select-none"
          style={{
            top: `${d.top}%`,
            animation: `float-left ${d.duration}s linear ${d.delay}s infinite`,
          }}
        >
          {d.text}
        </div>
      ))}
    </div>
  );
}
