/**
 * Data backup script — fetches all public data from Java API and writes to data/
 *
 * Usage: npx tsx scripts/backup-data.ts
 * Requires: NEXT_PUBLIC_API_BASE env pointing to the running Java API
 */
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:18016/api";
const OUT = path.resolve(import.meta.dirname, "..", "data");

// Minimal fetch wrapper matching the API response format { code, data }
async function apiGet<T>(endpoint: string): Promise<T> {
  const res = await fetch(`${BASE}${endpoint}`);
  if (!res.ok) throw new Error(`HTTP ${res.status} GET ${endpoint}`);
  const body = await res.json() as { code: number; data?: T; message?: string };
  if (body.code !== 1) throw new Error(body.message || `API error code=${body.code}`);
  return body.data as T;
}

async function apiPost<T, B>(endpoint: string, body: B): Promise<T> {
  const res = await fetch(`${BASE}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} POST ${endpoint}`);
  const json = await res.json() as { code: number; data?: T; message?: string };
  if (json.code !== 1) throw new Error(json.message || `API error code=${json.code}`);
  return json.data as T;
}

// Write JSON to the data directory
function save(name: string, data: unknown) {
  const file = path.join(OUT, name);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf-8");
  console.log(`  ✓ ${name}`);
}

async function main() {
  console.log(`Backing up data from ${BASE}\n`);

  // 1. Dashboard
  try {
    const dash = await apiGet<unknown>("/dashboard");
    save("dashboard.json", dash);
  } catch (e) { console.error("  ✗ dashboard:", (e as Error).message); }

  // 2. About
  try {
    const about = await apiGet<unknown>("/about");
    save("about.json", about);
  } catch (e) { console.error("  ✗ about:", (e as Error).message); }

  // 3. Categories
  try {
    const cats = await apiPost<unknown, unknown>("/category/page", { pageNum: 1, pageSize: 100 });
    save("categories.json", cats);
  } catch (e) { console.error("  ✗ categories:", (e as Error).message); }

  // 4. Tags
  try {
    const tags = await apiPost<unknown, unknown>("/tag/page", { pageNum: 1, pageSize: 100 });
    save("tags.json", tags);
  } catch (e) { console.error("  ✗ tags:", (e as Error).message); }

  // 5. Articles list + details
  try {
    const articleList = await apiPost<{ total: number; rows: { id: number }[] }, unknown>(
      "/article/public/page", { pageNum: 1, pageSize: 100 }
    );
    save("articles.json", articleList);
    const ids = articleList.rows.map((a) => a.id);
    console.log(`  → fetching ${ids.length} article details...`);
    for (const id of ids) {
      try {
        const detail = await apiGet<unknown>(`/article/public/${id}`);
        save(`articles/${id}.json`, detail);
      } catch (e) {
        console.error(`  ✗ articles/${id}:`, (e as Error).message);
      }
    }
  } catch (e) { console.error("  ✗ articles:", (e as Error).message); }

  // 6. Projects list + details
  try {
    const projectList = await apiPost<{ total: number; rows: { id: number }[] }, unknown>(
      "/project/public/page", { pageNum: 1, pageSize: 100 }
    );
    save("projects.json", projectList);
    const ids = projectList.rows.map((p) => p.id);
    console.log(`  → fetching ${ids.length} project details...`);
    for (const id of ids) {
      try {
        const detail = await apiGet<unknown>(`/project/public/${id}`);
        save(`projects/${id}.json`, detail);
      } catch (e) {
        console.error(`  ✗ projects/${id}:`, (e as Error).message);
      }
    }
  } catch (e) { console.error("  ✗ projects:", (e as Error).message); }

  // 7. Timeline
  try {
    const tl = await apiPost<unknown, unknown>("/timeline/page", { pageNum: 1, pageSize: 100 });
    save("timeline.json", tl);
  } catch (e) { console.error("  ✗ timeline:", (e as Error).message); }

  // 8. Skills
  try {
    const skills = await apiPost<unknown, unknown>("/skill/page", { pageNum: 1, pageSize: 100 });
    save("skills.json", skills);
  } catch (e) { console.error("  ✗ skills:", (e as Error).message); }

  // 9. Index manifest
  save("index.json", [
    "dashboard", "about", "articles", "projects",
    "categories", "tags", "timeline", "skills",
  ]);

  console.log("\nDone. Files saved to data/");
}

main().catch((e) => {
  console.error("Backup failed:", e);
  process.exit(1);
});
