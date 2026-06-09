"use client";
import { useEffect, useState, useMemo } from "react";
import { useSettingsStore } from "@/stores/settingsStore";

interface Petal {
  id: number;
  left: string;
  size: number;
  duration: number;
  delay: number;
}

export default function Sakura() {
  const particleDensity = useSettingsStore((s) => s.particleDensity);
  const count = useMemo(() => Math.max(0, Math.round(400 * particleDensity / 1000)), [particleDensity]);

  const [petals, setPetals] = useState<Petal[]>([]);

  useEffect(() => {
    if (count === 0) { setPetals([]); return; }
    setPetals(
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        size: 8 + Math.random() * 12,
        duration: 6 + Math.random() * 8,
        delay: Math.random() * -15,
      }))
    );
  }, [count]);

  if (count === 0) return null;

  return (
    <div className="fixed inset-0 w-full h-full pointer-events-none z-10 overflow-hidden">
      <style>{`
        @keyframes sakuraFall {
          0% { transform: translate(0, -10vh) rotate(0deg); opacity: 0; }
          10% { opacity: 1; }
          80% { opacity: 1; }
          100% { transform: translate(15vw, 110vh) rotate(360deg); opacity: 0; }
        }
      `}</style>
      {petals.map((p) => (
        <div
          key={p.id}
          className="absolute top-0 bg-pink-300/70 shadow-[0_0_5px_rgba(255,182,193,0.6)]"
          style={{
            left: p.left,
            width: `${p.size}px`,
            height: `${p.size * 1.2}px`,
            borderRadius: "100% 0 100% 0",
            animation: `sakuraFall ${p.duration}s linear infinite`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
