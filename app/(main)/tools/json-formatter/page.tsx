"use client";

import BackButton from "@/app/_components/article/BackButton";
import { useState } from "react";

export default function JsonFormatterPage() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [showCopyTip, setShowCopyTip] = useState(false);

  const format = (compact: boolean) => {
    setError("");
    try {
      const parsed = JSON.parse(input);
      setOutput(JSON.stringify(parsed, null, compact ? 0 : 2));
    } catch (e) {
      setError((e as Error).message);
      setOutput("");
    }
  };

  const copy = async () => {
    if (output) {
      await navigator.clipboard.writeText(output);
      setShowCopyTip(true);
      setTimeout(() => setShowCopyTip(false), 2000);
    }
  };

  return (
    <div className="w-[70%] mx-auto py-8 px-4">
      <BackButton />
      <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-slate-900 dark:text-white mb-2">
        📋 JSON 格式化
      </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          JSON 格式化/压缩/校验
        </p>

        <div className="rounded-2xl bg-white/40 dark:bg-slate-800/50 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-xl p-6 space-y-4">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="粘贴 JSON..."
            rows={14}
            className="w-full bg-white/50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl p-3 text-sm font-mono outline-none text-slate-800 dark:text-slate-200 resize-y"
          />

          <div className="flex gap-2 items-center">
            <button
              onClick={() => format(false)}
              className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-bold rounded-xl transition-colors"
            >
              格式化
            </button>
            <button
              onClick={() => format(true)}
              className="px-4 py-2 bg-slate-500 hover:bg-slate-600 text-white text-sm font-bold rounded-xl transition-colors"
            >
              压缩
            </button>
            {output && (
              <button
                onClick={copy}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold rounded-xl transition-colors"
              >
                复制
              </button>
            )}
            {showCopyTip && (
              <span className="text-sm text-emerald-600 dark:text-emerald-400 ml-2">
                ✓ 已复制
              </span>
            )}
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          {output && (
            <textarea
              readOnly
              value={output}
              rows={14}
              className="w-full bg-white/50 dark:bg-slate-700/50 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3 text-sm font-mono outline-none text-slate-800 dark:text-slate-200 resize-y"
            />
          )}
        </div>
    </div>
  );
}