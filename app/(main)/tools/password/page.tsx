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

  const copy = async () => {
    if (password) await navigator.clipboard.writeText(password);
  };

  return (
    <div className="max-w-xl mx-auto py-10">
      <BackButton />
      <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2">🔑 密码生成</h1>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">随机密码生成器，自定义长度与字符集</p>

      <div className="rounded-2xl bg-white/40 dark:bg-slate-800/50 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-xl p-6 space-y-5">
        {password && (
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-white/50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-3 font-mono text-lg text-slate-800 dark:text-slate-200 break-all select-all">{password}</div>
            <button onClick={copy} className="px-3 py-3 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold rounded-xl transition-colors">📋</button>
          </div>
        )}

        <div className="space-y-3">
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
        </div>

        <button onClick={generate}
          className="w-full py-3 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-bold rounded-xl transition-colors">
          生成密码
        </button>
      </div>
    </div>
  );
}
