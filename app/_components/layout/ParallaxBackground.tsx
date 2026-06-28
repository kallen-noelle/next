"use client";
import { useState, useEffect, useCallback } from "react";
import { siteConfig } from "@/lib/siteConfig";
import { assetUrl } from "@/lib/asset-url";

export default function ParallaxBackground() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isLoaded, setIsLoaded] = useState(false);
  const [bgIndex, setBgIndex] = useState(0);
  const images = siteConfig.bgImages;

  // 预加载第一张图片
  useEffect(() => {
    const img = new Image();
    img.src = assetUrl(images[0]);
    img.onload = () => setIsLoaded(true);
  }, [images]);

  // 自动轮播
  useEffect(() => {
    if (images.length <= 1) return;
    const timer = setInterval(() => {
      setBgIndex((prev) => (prev + 1) % images.length);
    }, 10000);
    return () => clearInterval(timer);
  }, [images.length]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const x = (e.clientX / window.innerWidth - 0.5) * 20;
    const y = (e.clientY / window.innerHeight - 0.5) * 20;
    setMousePos({ x, y });
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [handleMouseMove]);

  return (
    <div className="absolute inset-0 z-[-10] overflow-hidden">
      {/* 背景图片轮播层 */}
      {images.map((img, i) => (
        <div
          key={img}
          className="absolute inset-0 transition-opacity duration-[2000ms] ease-in-out"
          style={{
            transform: `translate(${mousePos.x * 0.5}px, ${mousePos.y * 0.5}px) scale(1.1)`,
            backgroundImage: `url(${assetUrl(img)})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: isLoaded && i === bgIndex ? 1 : 0,
          }}
        />
      ))}
      {/* 视差叠加层 */}
      {images.map((img, i) => (
        <div
          key={`${img}-overlay`}
          className="absolute inset-0 transition-transform duration-700 ease-out"
          style={{
            transform: `translate(${mousePos.x * 0.8}px, ${mousePos.y * 0.8}px) scale(1.15)`,
            backgroundImage: `url(${assetUrl(img)})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: isLoaded && i === bgIndex ? 0.4 : 0,
          }}
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40" />
    </div>
  );
}