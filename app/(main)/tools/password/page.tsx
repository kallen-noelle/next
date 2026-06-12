"use client";

import BackButton from "@/app/_components/article/BackButton";
import { useState, useCallback } from "react";

const LOWERCASE = "abcdefghijklmnopqrstuvwxyz";
const UPPERCASE = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const DIGITS = "0123456789";
const SYMBOLS = "!@#$%^&*()_+-=[]{}|;:,.<>?";

export default function PasswordPage() {
  const [length, setLength] = useState(16);
  const [includeUpper, setIncludeUpper] = useState(true);
  const [includeDigits, setIncludeDigits] = useState(true);
  const [includeSymbols, setIncludeSymbols] = useState(false);
  const [password, setPassword] = useState("");
  const [uuid, setUuid] = useState("");

  const generate = useCallback(() => {
    let chars = LOWERCASE;
    if (includeUpper) chars += UPPERCASE;
    if (includeDigits) chars += DIGITS;
    if (includeSymbols) chars += SYMBOLS;
    if (!chars) return;
    let result = "";
    const array = new Uint32Array(length);
    crypto.getRandomValues(array);
    for (let i = 0; i < length; i++) result += chars[array[i] % chars.length];
    setPassword(result);
  }, [length, includeUpper, includeDigits, includeSymbols]);

  const generateUUID = () => {
    if (crypto.randomUUID) {
      setUuid(crypto.randomUUID());
    } else {
      const uuid = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });
      setUuid(uuid);
    }
  };

  const copy = async (text: string) => {
    if (text) await navigator.clipboard.writeText(text);
  };

  return (
    <div className="w-[70%] mx-auto py-8 px-4">
      <BackButton />
      <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-slate-900 dark:text-white mb-2">🔑 密码生成器</h1>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">随机密码 & UUID v4 生成</p>

      {/* 密码卡片 */}
      <div className="rounded-2xl bg-white/40 dark:bg-slate-800/50 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-xl p-6 space-y-4 mb-6">
        <h2 className="text-sm font-black text-slate-700 dark:text-slate-300">随机密码</h2>

        {password && (
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-white/50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-3 font-mono text-sm text-slate-800 dark:text-slate-200 break-all select-all">
              {password}
            </div>
            <button onClick={() => copy(password)}
              className="px-3 py-3 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold rounded-xl transition-colors" title="复制密码">📋</button>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-600 dark:text-slate-300">长度: {length}</span>
          <input type="range" min={4} max={64} value={length} onChange={(e) => setLength(Number(e.target.value))} className="w-40" />
        </div>

        {[
          { label: "大写字母 A-Z", value: includeUpper, set: setIncludeUpper },
          { label: "数字 0-9", value: includeDigits, set: setIncludeDigits },
          { label: "特殊字符 !@#$%", value: includeSymbols, set: setIncludeSymbols },
        ].map((opt) => (
          <label key={opt.label} className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={opt.value} onChange={(e) => opt.set(e.target.checked)} className="rounded" />
            <span className="text-sm text-slate-600 dark:text-slate-300">{opt.label}</span>
          </label>
        ))}

        <button onClick={generate}
          className="w-full py-3 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-bold rounded-xl transition-colors">
          生成密码
        </button>
      </div>

      {/* UUID 卡片 */}
      <div className="rounded-2xl bg-white/40 dark:bg-slate-800/50 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-xl p-6">
        <h2 className="text-sm font-black text-slate-700 dark:text-slate-300 mb-4">UUID v4 生成器</h2>
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-white/50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-3 font-mono text-sm text-slate-800 dark:text-slate-200 break-all select-all">
            {uuid || "点击右侧按钮生成"}
          </div>
          <button onClick={generateUUID}
            className="px-3 py-3 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-bold rounded-xl transition-colors" title="生成 UUID">🔄</button>
          {uuid && (
            <button onClick={() => copy(uuid)}
              className="px-3 py-3 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold rounded-xl transition-colors" title="复制 UUID">📋</button>
          )}
        </div>
      </div>
    </div>
  );
}
