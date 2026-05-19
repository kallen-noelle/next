export default function AdminArticleLoading() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="h-8 w-28 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
        <div className="h-9 w-28 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse" />
      </div>
      <div className="flex flex-col gap-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="glass-card px-4 py-3 flex items-center gap-4 animate-pulse" style={{ animationDelay: `${i * 80}ms` }}>
            <div className="w-2 h-2 rounded-full bg-slate-200 dark:bg-slate-700" />
            <div className="flex-1 h-4 bg-slate-200 dark:bg-slate-700 rounded-md" />
            <div className="h-3 w-8 bg-slate-200 dark:bg-slate-700 rounded-md" />
            <div className="h-3 w-8 bg-slate-200 dark:bg-slate-700 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}
