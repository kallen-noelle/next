export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <aside className="w-64 bg-[var(--color-card)] border-r border-[var(--color-border)] p-4">
        <h2 className="text-lg font-semibold">Admin</h2>
        <nav className="mt-4 flex flex-col gap-2 text-sm text-[var(--color-text-secondary)]">
          <span>Dashboard</span>
          <span>Articles</span>
          <span>Projects</span>
          <span>Media</span>
        </nav>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
