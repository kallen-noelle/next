"use client";

import BackButton from "@/app/_components/article/BackButton";
import { useState } from "react";

export default function QRCodePage() {
  const [text, setText] = useState("");
  const [qrUrl, setQrUrl] = useState("");

  const generate = () => {
    if (!text.trim()) return;
    setQrUrl(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(text)}`);
  };

  return (
    <div className="max-w-2xl mx-auto py-10">
      <BackButton />
      <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2">📱 二维码生成</h1>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">文本/链接生成二维码，支持下载</p>

      <div className="rounded-2xl bg-white/40 dark:bg-slate-800/50 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-xl p-6">
        <textarea value={text} onChange={(e) => setText(e.target.value)}
          placeholder="输入文本或链接..."
          rows={3}
          className="w-full bg-white/50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl p-3 text-sm outline-none text-slate-800 dark:text-slate-200 mb-4"
        />
        <button onClick={generate}
          className="px-6 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-bold rounded-xl transition-colors">
          生成二维码
        </button>

        {qrUrl && (
          <div className="mt-6 flex flex-col items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrUrl} alt="QR Code" className="w-48 h-48" />
            <a href={qrUrl} download="qrcode.png"
              className="mt-3 text-xs text-indigo-500 hover:text-indigo-600 underline">
              下载图片
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
