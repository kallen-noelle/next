export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <aside className="w-64 glass-card !rounded-none border-r border-slate-200 dark:border-slate-700 p-6">
        <h2 className="text-lg font-black font-[family-name:var(--font-geist-sans)]">Admin</h2>
        <nav className="mt-6 flex flex-col gap-1 text-sm text-slate-500 dark:text-slate-400">
          {["Dashboard", "Articles", "Projects", "Media", "Tags", "About"].map((item) => (
            <span key={item} className="px-2 py-1.5 rounded-lg hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer transition-colors">
              {item}
            </span>
          ))}
        </nav>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
