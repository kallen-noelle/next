export default function ArticleLoading() {
  return (
    <>
      {/* Title skeleton */}
      <div className="h-10 w-40 bg-slate-200 dark:bg-slate-700 rounded-lg mb-2 animate-pulse" />
      <div className="h-5 w-64 bg-slate-200 dark:bg-slate-700 rounded-md mb-6 animate-pulse" />

      {/* Search bar skeleton */}
      <div className="h-12 w-full bg-slate-200 dark:bg-slate-700 rounded-xl mb-4 animate-pulse" />

      {/* Category nav skeleton */}
      <div className="flex gap-2 mb-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-8 w-20 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse" />
        ))}
      </div>

      {/* Tag skeleton */}
      <div className="flex gap-2 mb-8">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-6 w-14 bg-slate-200 dark:bg-slate-700 rounded-md animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
        ))}
      </div>

      {/* Article card skeletons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-2xl bg-white/40 dark:bg-slate-800/50 backdrop-blur-md border border-white/40 dark:border-white/10 p-6 animate-pulse" style={{ animationDelay: `${i * 100}ms` }}>
            <div className="h-5 w-3/4 bg-slate-200 dark:bg-slate-700 rounded-md mb-3" />
            <div className="h-4 w-full bg-slate-200 dark:bg-slate-700 rounded-md mb-2" />
            <div className="h-4 w-2/3 bg-slate-200 dark:bg-slate-700 rounded-md mb-4" />
            <div className="flex gap-2">
              <div className="h-5 w-16 bg-slate-200 dark:bg-slate-700 rounded-full" />
              <div className="h-5 w-12 bg-slate-200 dark:bg-slate-700 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
