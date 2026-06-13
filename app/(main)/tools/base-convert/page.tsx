"use client";

import BackButton from "@/app/_components/article/BackButton";
import SelectDropdown from "@/app/_components/admin/SelectDropdown";
import Tooltip from "@/app/_components/common/Tooltip";
import { useState, useMemo } from "react";

const bases = [
  { value: 2, label: "二进制 (2)", prefix: "0b" },
  { value: 8, label: "八进制 (8)", prefix: "0o" },
  { value: 10, label: "十进制 (10)", prefix: "" },
  { value: 16, label: "十六进制 (16)", prefix: "0x" },
];

export default function BaseConvertPage() {
  const [input, setInput] = useState("");
  const [fromBase, setFromBase] = useState(10);
  const [toBase, setToBase] = useState(16);
  const [error, setError] = useState("");

  // 解析输入字符串为十进制数（基于当前 fromBase）
  const parseToDecimal = (str: string, base: number): number | null => {
    if (!str.trim()) return null;
    try {
      // 去除可能的前缀（0b, 0o, 0x）
      let cleanStr = str.trim();
      if (base === 2 && cleanStr.startsWith("0b")) cleanStr = cleanStr.slice(2);
      if (base === 8 && cleanStr.startsWith("0o")) cleanStr = cleanStr.slice(2);
      if (base === 16 && cleanStr.startsWith("0x")) cleanStr = cleanStr.slice(2);

      // 允许负号
      const isNegative = cleanStr.startsWith("-");
      if (isNegative) cleanStr = cleanStr.slice(1);

      const value = parseInt(cleanStr, base);
      if (isNaN(value)) return null;
      return isNegative ? -value : value;
    } catch {
      return null;
    }
  };

  // 将十进制数转换为目标进制字符串
  const fromDecimal = (decimal: number, base: number): string => {
    if (isNaN(decimal)) return "";
    const isNegative = decimal < 0;
    const absValue = Math.abs(decimal);
    let result = absValue.toString(base);
    // 十六进制转大写
    if (base === 16) result = result.toUpperCase();
    return (isNegative ? "-" : "") + result;
  };

  const output = useMemo(() => {
    setError("");
    const decimal = parseToDecimal(input, fromBase);
    if (decimal === null) {
      if (input.trim() !== "") setError("无效的数字格式");
      return "";
    }
    return fromDecimal(decimal, toBase);
  }, [input, fromBase, toBase]);

  const handleSwap = () => {
    // 交换进制，同时尝试将输出作为新的输入
    const newFromBase = toBase;
    const newToBase = fromBase;
    setFromBase(newFromBase);
    setToBase(newToBase);
    if (output && !error) {
      setInput(output);
    }
  };

  return (
    <div className="min-h-screen p-8">
      <BackButton />
      <div className="w-[70%] mx-auto px-4">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2">🔄 进制转换</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">二进制 / 八进制 / 十进制 / 十六进制相互转换</p>

        <div className="rounded-2xl bg-white/40 dark:bg-slate-800/50 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-xl p-6 space-y-5">
          {/* 输入区域 */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">输入数值</label>
            <div className="flex gap-2">
              <div className="w-36">
                <SelectDropdown
                  options={bases}
                  value={fromBase}
                  onChange={(v) => setFromBase(Number(v))}
                  placeholder="选择进制"
                  renderOption={(b) => b.label}
                  getValue={(b) => b.value}
                />
              </div>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={`例如: ${fromBase === 2 ? "1010" : fromBase === 8 ? "12" : fromBase === 16 ? "A" : "10"}`}
                className="flex-1 bg-white/50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2 font-mono text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
          </div>

          {/* 交换按钮 */}
          <div className="flex justify-center">
            <Tooltip text="交换进制">
              <button
                onClick={handleSwap}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-xl text-sm font-medium transition-colors"
              >
                ⇅ 交换
            </button>
            </Tooltip>
          </div>

          {/* 输出区域 */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">转换结果</label>
            <div className="flex gap-2">
              <div className="w-36">
                <SelectDropdown
                  options={bases}
                  value={toBase}
                  onChange={(v) => setToBase(Number(v))}
                  placeholder="选择进制"
                  renderOption={(b) => b.label}
                  getValue={(b) => b.value}
                />
              </div>
              <div className="flex-1 bg-white/50 dark:bg-slate-700/50 border border-emerald-200 dark:border-emerald-800 rounded-xl px-4 py-2 font-mono text-sm text-slate-800 dark:text-slate-200 break-all min-h-[42px]">
                {output || (input.trim() === "" ? "等待输入" : "无效输入")}
              </div>
              {output && !error && (
                <Tooltip text="复制结果">
                  <button
                    onClick={() => navigator.clipboard.writeText(output)}
                    className="px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold rounded-xl transition-colors"
                  >
                    📋
                  </button>
                </Tooltip>
              )}
            </div>
          </div>

          {/* 快速填充示例 */}
          <div className="pt-2">
            <p className="text-xs text-slate-500 mb-2">示例：</p>
            <div className="flex flex-wrap gap-2">
              {[
                { label: "二进制 1010", value: "1010", from: 2 },
                { label: "八进制 12", value: "12", from: 8 },
                { label: "十进制 10", value: "10", from: 10 },
                { label: "十六进制 A", value: "A", from: 16 },
                { label: "十六进制 FF", value: "FF", from: 16 },
              ].map((example) => (
                <button
                  key={example.label}
                  onClick={() => {
                    setFromBase(example.from);
                    setInput(example.value);
                  }}
                  className="px-2 py-1 bg-slate-100 dark:bg-slate-700/50 rounded-lg text-xs hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                >
                  {example.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}