/**
 * Static data layer — detects runtime mode and provides local JSON data
 *
 * Mode detection:
 *   GitHub Pages → /data/index.json exists  → static mode → read from /data/
 *   Docker/dev   → /data/index.json 404     → live mode   → axios calls as normal
 */

let mode: "static" | "live" | "unknown" = "unknown";
const cache = new Map<string, unknown>();

function dataUrl(path: string): string {
  return `/data/${path}`;
}

/** Detect whether static data files are available */
export async function detectMode(): Promise<"static" | "live"> {
  if (mode !== "unknown") return mode;
  if (process.env.NEXT_PUBLIC_IS_STATIC === "true") {
    mode = "static";
    return mode;
  }
  try {
    const res = await fetch(dataUrl("index.json"), { method: "HEAD" });
    mode = res.ok ? "static" : "live";
  } catch {
    mode = "live";
  }
  return mode;
}

/**
 * Ensure data for a key is loaded M-bM-^@M-^T fetches on demand if not in cache.
 */
export async function ensureData<T>(key: string): Promise<T | null> {
  const cached = cache.get(key);
  if (cached !== undefined) return cached as T;

  const m = await detectMode();
  if (m !== "static") return null;

  try {
    const res = await fetch(dataUrl(`${key}.json`));
    if (!res.ok) return null;
    const data = (await res.json()) as T;
    cache.set(key, data);
    return data;
  } catch {
    return null;
  }
}

/** Fetch a detail object by type directory and id */
export async function getDetailData<T>(dir: string, id: number): Promise<T | null> {
  try {
    const res = await fetch(dataUrl(`${dir}/${id}.json`));
    return res.ok ? (await res.json() as T) : null;
  } catch {
    return null;
  }
}
