export default function MainPage() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <h1 className="text-5xl font-light tracking-wide text-[var(--text)]">
        Dream Blog
      </h1>
      <p className="mt-4 text-base text-[var(--text-secondary)] max-w-md leading-relaxed">
        A personal space for code, science, and thoughts.
      </p>
      <div className="mt-14 grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-2xl">
        <div className="glass-card p-7 text-center">
          <span className="text-2xl opacity-60">&#x1D453;</span>
          <p className="mt-3 text-sm text-[var(--text-secondary)]">Articles</p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">Tech &amp; Research</p>
        </div>
        <div className="glass-card p-7 text-center">
          <span className="text-2xl opacity-60">&lt;/&gt;</span>
          <p className="mt-3 text-sm text-[var(--text-secondary)]">Projects</p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">Code &amp; Build</p>
        </div>
        <div className="glass-card p-7 text-center">
          <span className="text-2xl opacity-60">&#9835;</span>
          <p className="mt-3 text-sm text-[var(--text-secondary)]">Music</p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">Focus &amp; Relax</p>
        </div>
      </div>
    </div>
  );
}
