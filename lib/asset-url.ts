/**
 * Resolve a public asset path, accounting for GitHub Pages basePath.
 *
 * During static export build, `NEXT_PUBLIC_BASE_PATH` is set to `/next` by the
 * deploy workflow. In Docker/dev mode it's unset, so the path is used as-is.
 */
export function assetUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_BASE_PATH || "";
  // Fallback for client-side runtime where env var may not be inlined
  if (!base && typeof window !== "undefined") {
    const p = window.location.pathname;
    if (p.startsWith("/next/") || p === "/next") return `/next${path}`;
  }
  return `${base}${path}`;
}
