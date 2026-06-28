export default function Tooltip({ text, children, position = "top" }: { text: string; children: React.ReactNode; position?: "top" | "bottom" | "right" }) {
  const positionClasses = {
    top: "-top-8 left-1/2 -translate-x-1/2",
    bottom: "top-full mt-2 left-1/2 -translate-x-1/2",
    right: "left-full ml-2 top-1/2 -translate-y-1/2",
  };
  
  return (
    <span className="relative group/tip inline-flex">
      {children}
      <span className={`absolute glass-card !rounded-lg text-[10px] font-bold px-2 py-0.5 whitespace-nowrap text-slate-600 dark:text-slate-300 opacity-0 group-hover/tip:opacity-100 transition-opacity pointer-events-none z-[100] ${positionClasses[position]}`}>
        {text}
      </span>
    </span>
  );
}
