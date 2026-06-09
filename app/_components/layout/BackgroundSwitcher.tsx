"use client";
import { useState, useEffect } from "react";
import { siteConfig } from "@/lib/siteConfig";
import { assetUrl } from "@/lib/asset-url";
import { useSettingsStore } from "@/stores/settingsStore";

export default function BackgroundSlider() {
  const bgImageIndex = useSettingsStore((s) => s.bgImageIndex);
  const [index, setIndex] = useState(0);
  const images = siteConfig.bgImages;

  // 手动选图时跳转，计时器继续跑
  useEffect(() => {
    if (bgImageIndex >= 0) setIndex(bgImageIndex);
  }, [bgImageIndex]);

  useEffect(() => {
    if (images.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length);
    }, 10000);
    return () => clearInterval(timer);
  }, [images.length]);

  return (
    <div className="absolute inset-0 z-[-10] overflow-hidden">
      {images.map((img, i) => {
        const isActive = i === index;
        const isAdjacent = i === (index + 1) % images.length ||
                           (index === 0 && i === images.length - 1);
        if (!isActive && !isAdjacent) return null;
        return (
          <div
            key={img}
            className="absolute inset-0 transition-opacity duration-[2000ms] ease-in-out will-change-opacity"
            style={{
              backgroundImage: `url(${assetUrl(img)})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              opacity: isActive ? 1 : 0,
            }}
          />
        );
      })}
    </div>
  );
}
