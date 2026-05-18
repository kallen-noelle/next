export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto py-10 text-center">
      <p className="text-xs text-[var(--text-muted)]">
        &copy; {year} Dream Blog
      </p>
    </footer>
  );
}
