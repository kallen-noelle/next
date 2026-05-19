"use client";

import { useEffect, useRef } from "react";

interface Ripple { x: number; y: number; r: number; maxR: number; opacity: number; velocity: number }

export default function ClickEffect() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const ripples: Ripple[] = [];
    let animId: number;

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener("resize", resize);

    const onPointerDown = (e: PointerEvent) => {
      ripples.push({ x: e.clientX, y: e.clientY, r: 0, maxR: 60, opacity: 0.6, velocity: 2.5 });
    };
    window.addEventListener("pointerdown", onPointerDown);

    function animate() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.shadowBlur = 15;
      ctx.shadowColor = "rgba(129, 140, 248, 0.5)";

      for (let i = ripples.length - 1; i >= 0; i--) {
        const rp = ripples[i];
        rp.r += rp.velocity;
        rp.velocity *= 0.96;
        rp.opacity -= 0.015;
        if (rp.opacity <= 0) { ripples.splice(i, 1); continue; }
        // Outer ring
        ctx.beginPath();
        ctx.arc(rp.x, rp.y, rp.r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(129,140,248,${rp.opacity})`;
        ctx.lineWidth = 2;
        ctx.stroke();
        // Inner fill
        ctx.beginPath();
        ctx.arc(rp.x, rp.y, rp.r * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(129,140,248,${rp.opacity * 0.3})`;
        ctx.fill();
      }
      animId = requestAnimationFrame(animate);
    }
    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointerdown", onPointerDown);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-[9999]" aria-hidden />;
}
