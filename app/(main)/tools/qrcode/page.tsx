"use client";

import BackButton from "@/app/_components/article/BackButton";
import { useState } from "react";

const MAX_LENGTH = 2000;

export default function QRCodePage() {
  const [text, setText] = useState("");
  const [qrUrl, setQrUrl] = useState("");
  const [error, setError] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);

  const generate = () => {
    const trimmed = text.trim();
    if (!trimmed) {
      setError("请输入文本或链接");
      return;
    }
    if (trimmed.length > MAX_LENGTH) {
      setError(`内容过长，请控制在 ${MAX_LENGTH} 字符以内（当前 ${trimmed.length}）`);
      return;
    }
    setError("");
    // 提高生成图片分辨率，与显示尺寸匹配或更大（这里用 500x500）
    setQrUrl(`https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(trimmed)}`);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setText(val);
    if (val.length > MAX_LENGTH) {
      setError(`内容过长（${val.length}/${MAX_LENGTH}）`);
    } else if (error && error.includes("过长")) {
      setError("");
    } else if (!val.trim()) {
      setError("");
    }
  };

  const isOverLimit = text.length > MAX_LENGTH;

  const downloadImage = async () => {
    if (!qrUrl) return;
    setIsDownloading(true);
    try {
      const response = await fetch(qrUrl);
      if (!response.ok) throw new Error("下载失败");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `qrcode_${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError("下载图片失败，请重试");
      console.error(err);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="w-[70%] mx-auto py-8 px-4">
      <BackButton />
      <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-slate-900 dark:text-white mb-2">📱 二维码生成</h1>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
        文本/链接生成二维码，支持下载（最大 {MAX_LENGTH} 字符）
      </p>

      <div className="rounded-2xl bg-white/40 dark:bg-slate-800/50 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-xl p-6">
        <div className="relative">
          <textarea
            value={text}
            onChange={handleTextChange}
            placeholder={`输入文本或链接（最多 ${MAX_LENGTH} 字符）...`}
            rows={4}
            className="w-full bg-white/50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl p-3 text-sm outline-none text-slate-800 dark:text-slate-200 resize-y pr-20"
          />
          <div
            className={`absolute bottom-3 right-3 text-xs ${text.length > MAX_LENGTH ? "text-red-500" : "text-slate-400"
              }`}
          >
            {text.length}/{MAX_LENGTH}
          </div>
        </div>

        <div className="flex items-center gap-3 mt-4">
          <button
            onClick={generate}
            disabled={isOverLimit || !text.trim()}
            className={`px-6 py-2 text-sm font-bold rounded-xl transition-colors ${isOverLimit || !text.trim()
              ? "bg-slate-300 dark:bg-slate-600 cursor-not-allowed text-slate-500 dark:text-slate-400"
              : "bg-indigo-500 hover:bg-indigo-600 text-white"
              }`}
          >
            生成二维码
          </button>
          {error && <span className="text-sm text-red-500">{error}</span>}
        </div>

        {qrUrl && !error && (
          <div className="mt-6 flex flex-col items-center">
            {/* 卡片式二维码容器，增加背景、圆角、阴影和内边距 */}
            <div className="bg-white/40 dark:bg-slate-800/50 backdrop-blur-md border border-white/40 dark:border-white/10 p-4 rounded-2xl shadow-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrUrl}
                alt="QR Code"
                className="w-64 h-64 object-contain" // 显示 256x256，实际图片 500x500 更清晰
              />
            </div>
            <button
              onClick={downloadImage}
              disabled={isDownloading}
              className={`mt-4 px-4 py-2 text-sm font-bold rounded-xl transition-colors ${isDownloading
                ? "bg-slate-300 dark:bg-slate-600 cursor-not-allowed text-slate-500 dark:text-slate-400"
                : "bg-emerald-500 hover:bg-emerald-600 text-white"
                }`}
            >
              {isDownloading ? "下载中..." : "⬇️ 下载图片"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}