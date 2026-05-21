"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface DatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 20 }, (_, i) => currentYear - 10 + i);
const months = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"));
const days = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, "0"));

export default function DatePicker({ value, onChange, placeholder = "Select date", disabled }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const parts = value ? value.split("-") : [];
  const selectedYear = parts[0] || String(currentYear);
  const selectedMonth = parts[1] || "01";
  const selectedDay = parts[2] || "01";

  const select = (y: string, m: string, d: string) => {
    const maxDay = new Date(Number(y), Number(m), 0).getDate();
    const safeDay = String(Math.min(Number(d), maxDay)).padStart(2, "0");
    onChange(`${y}-${m}-${safeDay}`);
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(!open)}
        className="w-full glass-card !rounded-xl px-4 py-2.5 text-sm outline-none bg-white/50 dark:bg-slate-800/50 flex items-center justify-between gap-2 disabled:opacity-50"
      >
        <span className={value ? "text-slate-700 dark:text-slate-200" : "text-slate-400"}>
          {value || placeholder}
        </span>
        <svg className={`w-4 h-4 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 top-full mt-1 left-0 glass-card !rounded-xl p-2 shadow-xl flex gap-1"
          >
            {/* Year column */}
            <div className="flex-1 max-h-48 overflow-y-auto">
              <div className="text-[10px] font-bold text-slate-400 px-2 py-1 sticky top-0 bg-white/50 dark:bg-slate-800/50 backdrop-blur">Year</div>
              {years.map((y) => (
                <button
                  key={y}
                  type="button"
                  onClick={() => select(String(y), selectedMonth, selectedDay)}
                  className={`w-full text-center px-2 py-1 text-xs rounded-md transition-colors ${
                    String(y) === selectedYear ? "bg-indigo-500 text-white font-bold" : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                  }`}
                >
                  {y}
                </button>
              ))}
            </div>
            {/* Month column */}
            <div className="flex-1 max-h-48 overflow-y-auto">
              <div className="text-[10px] font-bold text-slate-400 px-2 py-1 sticky top-0 bg-white/50 dark:bg-slate-800/50 backdrop-blur">Month</div>
              {months.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => select(selectedYear, m, selectedDay)}
                  className={`w-full text-center px-2 py-1 text-xs rounded-md transition-colors ${
                    m === selectedMonth ? "bg-indigo-500 text-white font-bold" : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
            {/* Day column */}
            <div className="flex-1 max-h-48 overflow-y-auto">
              <div className="text-[10px] font-bold text-slate-400 px-2 py-1 sticky top-0 bg-white/50 dark:bg-slate-800/50 backdrop-blur">Day</div>
              {days.map((d) => {
                const maxDay = new Date(Number(selectedYear), Number(selectedMonth), 0).getDate();
                const dayNum = Number(d);
                const disabled = dayNum > maxDay;
                return (
                  <button
                    key={d}
                    type="button"
                    disabled={disabled}
                    onClick={() => select(selectedYear, selectedMonth, d)}
                    className={`w-full text-center px-2 py-1 text-xs rounded-md transition-colors ${
                      disabled ? "text-slate-300 dark:text-slate-600 cursor-not-allowed" :
                      d === selectedDay ? "bg-indigo-500 text-white font-bold" : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    {d}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
