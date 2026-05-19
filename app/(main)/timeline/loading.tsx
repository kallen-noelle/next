export default function TimelineLoading() {
  return (
    <>
      {/* Title skeleton */}
      <div className="h-10 w-44 bg-slate-200 dark:bg-slate-700 rounded-lg mb-2 animate-pulse" />
      <div className="h-5 w-72 bg-slate-200 dark:bg-slate-700 rounded-md mb-8 animate-pulse" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Timeline skeletons */}
        <div className="lg:col-span-7">
          <div className="h-6 w-24 bg-slate-200 dark:bg-slate-700 rounded-md mb-4 animate-pulse" />
          <div className="space-y-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-4 animate-pulse" style={{ animationDelay: `${i * 150}ms` }}>
                <div className="w-px bg-slate-200 dark:bg-slate-700" />
                <div className="flex-1">
                  <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded-md mb-2" />
                  <div className="h-5 w-48 bg-slate-200 dark:bg-slate-700 rounded-md mb-1" />
                  <div className="h-4 w-full bg-slate-200 dark:bg-slate-700 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Skill bar skeletons */}
        <div className="lg:col-span-5">
          <div className="h-6 w-16 bg-slate-200 dark:bg-slate-700 rounded-md mb-4 animate-pulse" />
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse" style={{ animationDelay: `${i * 100}ms` }}>
                <div className="flex justify-between mb-1">
                  <div className="h-4 w-16 bg-slate-200 dark:bg-slate-700 rounded-md" />
                  <div className="h-4 w-8 bg-slate-200 dark:bg-slate-700 rounded-md" />
                </div>
                <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
