"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface Props {
  images?: string[];
  interval?: number;
}

const BG_FILES = [
  "1.jpg", "2.jpg", "3.jpg", "4.jpg", "5.PNG",
  "6.png", "7.JPG", "8.JPG", "9.jpg", "10.jpg",
];

export default function BackgroundSwitcher({
  images,
  interval = 20000,
}: Props) {
  const imgList = images ?? BG_FILES.map((f) => `/bg/${f}`);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [nextIdx, setNextIdx] = useState<number | null>(null);
  const [fadingOut, setFadingOut] = useState(false);
  const preloaded = useRef(new Set<number>([0]));
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startTransition = useCallback(() => {
    const next = (currentIdx + 1) % imgList.length;
    // Preload if needed
    if (!preloaded.current.has(next)) {
      const img = new Image();
      img.src = imgList[next];
      preloaded.current.add(next);
    }
    setNextIdx(next);
    // Trigger crossfade after a tick so the next image renders at opacity 0 first
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setFadingOut(true);
      });
    });
  }, [currentIdx, imgList]);

  // Rotate on interval
  useEffect(() => {
    timerRef.current = setInterval(startTransition, interval);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [startTransition, interval]);

  // After fade-out completes, swap images and fade in
  useEffect(() => {
    if (!fadingOut || nextIdx === null) return;
    const timeout = setTimeout(() => {
      setCurrentIdx(nextIdx);
      setNextIdx(null);
      setFadingOut(false);
    }, 2000); // match CSS transition duration
    return () => clearTimeout(timeout);
  }, [fadingOut, nextIdx]);

  return (
    <div className="fixed inset-0 -z-[1]" aria-hidden>
      {/* Current image — fades out */}
      <img
        src={imgList[currentIdx]}
        alt=""
        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-[2000ms] ease-in-out"
        style={{ opacity: fadingOut ? 0 : 0.22 }}
      />
      {/* Next image — fades in */}
      {nextIdx !== null && (
        <img
          src={imgList[nextIdx]}
          alt=""
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-[2000ms] ease-in-out"
          style={{ opacity: fadingOut ? 0.22 : 0 }}
        />
      )}

      {/* Highlight gradient overlay — brighter center, darker edges */}
      <div
        className="absolute inset-0 backdrop-blur-[6px]"
        style={{
          background: `
            radial-gradient(ellipse 70% 60% at 50% 40%, rgba(20,22,40,0.55) 0%, rgba(12,14,28,0.78) 100%)
          `,
        }}
      />
    </div>
  );
}
