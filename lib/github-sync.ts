"use client";

import type { Media } from "@/lib/types";

const GH_API = "https://api.github.com";
const OWNER = "pc-Blog";
const REPO = "next";
const BRANCH = "data";

export interface SyncProgress {
  stage: "collecting" | "blobs" | "tree" | "done" | "error";
  message: string;
}

type ProgressCb = (p: SyncProgress) => void;

// GitHub API helper
async function gh(url: string, token: string, method = "GET", body?: unknown) {
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/vnd.github+json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub API ${res.status}: ${text.slice(0, 300)}`);
  }
  return res.json();
}

// Media sync helpers
async function fetchImageAsBase64(url: string): Promise<{ base64: string; mime: string }> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching image: ${url}`);
  const blob = await res.blob();
  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return { base64: btoa(binary), mime: blob.type };
}

function mimeToExt(mime?: string): string {
  if (!mime) return ".bin";
  const map: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/gif": ".gif",
    "image/webp": ".webp",
    "image/svg+xml": ".svg",
  };
  return map[mime] || ".bin";
}

function extFromFilename(name?: string): string {
  if (!name) return ".bin";
  const i = name.lastIndexOf(".");
  return i !== -1 ? name.slice(i) : ".bin";
}

function replaceMediaUrls(
  content: string,
  mediaMap: Map<number, { newPath: string; originalUrl: string }>
): string {
  let result = content;
  for (const [, { newPath, originalUrl }] of mediaMap) {
    if (!originalUrl) continue;
    // Replace exact original URL (handles MinIO / full URLs)
    result = result.replaceAll(originalUrl, newPath);
    // Also replace protocol-relative variant (//host/path)
    if (originalUrl.startsWith("http:") || originalUrl.startsWith("https:")) {
      const protoRel = originalUrl.replace(/^https?:/, "");
      result = result.replaceAll(protoRel, newPath);
    }
    // Extract path-only and replace (/api/media/file/{id})
    const pathOnly = originalUrl.replace(/^https?:\/\/[^/]+/, "");
    if (pathOnly !== originalUrl && !pathOnly.startsWith("/api/media/file/")) {
      result = result.replaceAll(pathOnly, newPath);
    }
  }
  return result;
}

interface MediaItem {
  id: number;
  filename: string;
  base64: string;
}

async function collectMedia(
  apiBase: string,
  onProgress?: ProgressCb
): Promise<{ mediaItems: MediaItem[]; mediaMap: Map<number, { newPath: string; originalUrl: string }> }> {
  const mediaItems: MediaItem[] = [];
  const mediaMap = new Map<number, { newPath: string; originalUrl: string }>();

  let mediaRows: Media[] = [];
  try {
    const res = await fetch(`${apiBase}/media/page`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pageNum: 1, pageSize: 999 }),
    });
    const body = await res.json() as { code: number; data?: { rows?: Media[] } };
    mediaRows = body.data?.rows || [];
  } catch {
    // media endpoint not available; skip image sync
    return { mediaItems, mediaMap };
  }

  onProgress?.({ stage: "collecting", message: `Found ${mediaRows.length} media files. Downloading...` });

  for (const media of mediaRows) {
    if (media.id == null) continue;
    try {
      // fileUrl may be relative or absolute; build full URL for fetch
      const url = media.fileUrl.startsWith("http")
        ? media.fileUrl
        : `${apiBase}${media.fileUrl}`;
      const { base64, mime } = await fetchImageAsBase64(url);
      const ext = mimeToExt(mime) || extFromFilename(media.originalFilename) || ".bin";
      const filename = `${media.id}${ext}`;
      mediaItems.push({ id: media.id, filename, base64 });
      // /next prefix: data branch is only consumed by GH Pages build (basePath: /next)
      mediaMap.set(media.id, { newPath: `/next/data/media/${filename}`, originalUrl: media.fileUrl });
    } catch {
      // skip individual media if download fails
      console.warn("Failed to download media:", media.id, media.fileUrl);
    }
  }

  return { mediaItems, mediaMap };
}

// Collect all data from Java backend
async function collectAllData(): Promise<{ path: string; content: string }[]> {
  const base =
    typeof window !== "undefined"
      ? process.env.NEXT_PUBLIC_API_BASE || "http://localhost:18016/api"
      : "http://localhost:18016/api";

  async function apiGet<T>(ep: string): Promise<T> {
    const res = await fetch(`${base}${ep}`);
    if (!res.ok) throw new Error(`HTTP ${res.status} GET ${ep}`);
    const body = await res.json();
    if (body.code !== 1) throw new Error(body.message || `API error GET ${ep}`);
    return body.data as T;
  }

  async function apiPost<T, B>(ep: string, body: B): Promise<T> {
    const res = await fetch(`${base}${ep}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} POST ${ep}`);
    const json = await res.json();
    if (json.code !== 1) throw new Error(json.message || `API error POST ${ep}`);
    return json.data as T;
  }

  const PAGE = { pageNum: 1, pageSize: 100 };
  const files: { path: string; content: string }[] = [];

  // Dashboard
  const dash = await apiGet<unknown>("/dashboard");
  files.push({ path: "dashboard.json", content: JSON.stringify(dash, null, 2) });

  // About
  const about = await apiGet<unknown>("/about");
  files.push({ path: "about.json", content: JSON.stringify(about, null, 2) });

  // Categories
  const cats = await apiPost<unknown, unknown>("/category/page", PAGE);
  files.push({ path: "categories.json", content: JSON.stringify(cats, null, 2) });

  // Tags
  const tags = await apiPost<unknown, unknown>("/tag/page", PAGE);
  files.push({ path: "tags.json", content: JSON.stringify(tags, null, 2) });

  // Timeline
  const tl = await apiPost<unknown, unknown>("/timeline/page", PAGE);
  files.push({ path: "timeline.json", content: JSON.stringify(tl, null, 2) });

  // Skills
  const skills = await apiPost<unknown, unknown>("/skill/page", PAGE);
  files.push({ path: "skills.json", content: JSON.stringify(skills, null, 2) });

  // Articles list + details
  const articleList = await apiPost<{ total: number; rows: { id: number }[] }, unknown>(
    "/article/public/page", PAGE
  );
  files.push({ path: "articles.json", content: JSON.stringify(articleList, null, 2) });
  for (const a of articleList.rows) {
    try {
      const detail = await apiGet<unknown>(`/article/public/${a.id}`);
      files.push({ path: `articles/${a.id}.json`, content: JSON.stringify(detail, null, 2) });
    } catch {
      // skip individual detail if it fails
    }
  }

  // Projects list + details
  const projectList = await apiPost<{ total: number; rows: { id: number }[] }, unknown>(
    "/project/public/page", PAGE
  );
  files.push({ path: "projects.json", content: JSON.stringify(projectList, null, 2) });
  for (const p of projectList.rows) {
    try {
      const detail = await apiGet<unknown>(`/project/public/${p.id}`);
      files.push({ path: `projects/${p.id}.json`, content: JSON.stringify(detail, null, 2) });
    } catch {
      // skip individual detail if it fails
    }
  }

  // Comments
  try {
    const comments = await apiPost<unknown, unknown>("/comment/page", PAGE);
    files.push({ path: "comments.json", content: JSON.stringify(comments, null, 2) });
  } catch {
    // skip if comment endpoint unavailable
  }

  // Index manifest
  files.push({
    path: "index.json",
    content: JSON.stringify(
      ["dashboard", "about", "articles", "projects", "categories", "tags", "timeline", "skills", "comments"],
      null,
      2
    ),
  });

  return files;
}

export interface SyncResult {
  success: boolean;
  commitSha?: string;
  filesCount: number;
  error?: string;
}

export async function syncToGithub(
  token: string,
  onProgress?: ProgressCb
): Promise<SyncResult> {
  try {
    // 1. Collect data
    onProgress?.({ stage: "collecting", message: "Fetching data from API..." });
    const files = await collectAllData();
    onProgress?.({ stage: "collecting", message: `Collected ${files.length} files.` });

    // Compute API base (same logic as collectAllData)
    const apiBase =
      typeof window !== "undefined"
        ? process.env.NEXT_PUBLIC_API_BASE || "http://localhost:18016/api"
        : "http://localhost:18016/api";

    // 2. Collect media and replace URLs in data files
    onProgress?.({ stage: "collecting", message: "Fetching media files..." });
    const { mediaItems, mediaMap } = await collectMedia(apiBase, onProgress);
    const patchedFiles = mediaMap.size > 0
      ? files.map((f) => ({ path: f.path, content: replaceMediaUrls(f.content, mediaMap) }))
      : files;

    // 3. Get current data branch ref
    onProgress?.({ stage: "blobs", message: "Connecting to GitHub..." });
    const ref = await gh(
      `${GH_API}/repos/${OWNER}/${REPO}/git/ref/heads/${BRANCH}`,
      token
    );
    const currentCommit = await gh(ref.object.url, token);
    const baseTreeSha: string = currentCommit.tree.sha;

    // 4. Create blobs for each patched data file
    onProgress?.({ stage: "blobs", message: `Creating ${patchedFiles.length} blobs on GitHub...` });
    const blobResults = await Promise.all(
      patchedFiles.map(async (f) => {
        const blob = await gh(
          `${GH_API}/repos/${OWNER}/${REPO}/git/blobs`,
          token,
          "POST",
          { content: f.content, encoding: "utf-8" }
        );
        return { path: f.path, sha: blob.sha as string };
      })
    );

    // 5. Create blobs for media files (base64)
    if (mediaItems.length > 0) {
      onProgress?.({ stage: "blobs", message: `Uploading ${mediaItems.length} media files...` });
      const mediaBlobResults = await Promise.all(
        mediaItems.map(async (m) => {
          const blob = await gh(
            `${GH_API}/repos/${OWNER}/${REPO}/git/blobs`,
            token,
            "POST",
            { content: m.base64, encoding: "base64" }
          );
          return { path: `media/${m.filename}`, sha: blob.sha as string };
        })
      );
      blobResults.push(...mediaBlobResults);
    }

    // 6. Group blobs — root files vs subdirectory files
    const rootFiles = blobResults.filter((b) => !b.path.includes("/"));
    const dirFiles = new Map<string, { path: string; sha: string }[]>();

    for (const b of blobResults) {
      const idx = b.path.indexOf("/");
      if (idx !== -1) {
        const dir = b.path.slice(0, idx);
        if (!dirFiles.has(dir)) dirFiles.set(dir, []);
        dirFiles.get(dir)!.push({ path: b.path.slice(idx + 1), sha: b.sha });
      }
    }

    // 7. Create subdirectory trees (articles/, projects/, media/)
    onProgress?.({ stage: "tree", message: `Building tree (${blobResults.length} blobs)...` });

    const treeEntries: { path: string; mode: string; type: string; sha: string }[] = [
      ...rootFiles.map((b) => ({ path: b.path, mode: "100644", type: "blob" as const, sha: b.sha })),
    ];

    for (const [dir, entries] of dirFiles) {
      if (entries.length === 0) continue;
      const subTree = await gh(
        `${GH_API}/repos/${OWNER}/${REPO}/git/trees`,
        token,
        "POST",
        {
          tree: entries.map((e) => ({
            path: e.path,
            mode: "100644",
            type: "blob",
            sha: e.sha,
          })),
        }
      );
      treeEntries.push({ path: dir, mode: "040000", type: "tree", sha: subTree.sha as string });
    }

    // 8. Get base tree to preserve .github/ (workflow file), discard everything else
    onProgress?.({ stage: "tree", message: "Creating tree..." });
    const baseTree = await gh(`${GH_API}/repos/${OWNER}/${REPO}/git/trees/${baseTreeSha}`, token);
    const ghEntry = baseTree.tree.find((t: any) => t.path === ".github");
    if (ghEntry) {
      treeEntries.push({ path: ".github", mode: ghEntry.mode, type: "tree", sha: ghEntry.sha });
    }

    // Create root tree WITHOUT base_tree — only what's in treeEntries survives
    const newTree = await gh(
      `${GH_API}/repos/${OWNER}/${REPO}/git/trees`,
      token,
      "POST",
      { tree: treeEntries }
    );

    // 9. Create commit
    onProgress?.({ stage: "tree", message: "Creating commit..." });
    const total = patchedFiles.length + mediaItems.length;
    const newCommit = await gh(
      `${GH_API}/repos/${OWNER}/${REPO}/git/commits`,
      token,
      "POST",
      {
        message: `${new Date().toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })} sync data from admin\n\nAuto-synced ${patchedFiles.length} files${mediaItems.length > 0 ? ` + ${mediaItems.length} media` : ""}.`,
        tree: newTree.sha,
        parents: [ref.object.sha],
      }
    );

    // 10. Update ref
    onProgress?.({ stage: "done", message: "Pushing to data branch..." });
    await gh(
      `${GH_API}/repos/${OWNER}/${REPO}/git/refs/heads/${BRANCH}`,
      token,
      "PATCH",
      { sha: newCommit.sha, force: true }
    );

    onProgress?.({ stage: "done", message: `Sync complete! ${patchedFiles.length} files, ${mediaItems.length} media synced.` });
    return { success: true, commitSha: newCommit.sha as string, filesCount: total };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    onProgress?.({ stage: "error", message: msg });
    return { success: false, filesCount: 0, error: msg };
  }
}