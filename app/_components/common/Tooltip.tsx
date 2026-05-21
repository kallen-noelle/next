export default function Tooltip({ text, children }: { text: string; children: React.ReactNode }) {
  return (
    <span className="relative group/tip inline-flex">
      {children}
      <span className="absolute -top-8 left-1/2 -translate-x-1/2 glass-card !rounded-lg text-[10px] font-bold px-2 py-0.5 whitespace-nowrap text-slate-600 dark:text-slate-300 opacity-0 group-hover/tip:opacity-100 transition-opacity pointer-events-none z-50">
        {text}
      </span>
    </span>
  );
}
