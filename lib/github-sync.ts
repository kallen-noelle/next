"use client";

import type { Media, OpMusic } from "@/lib/types";

const GH_API = "https://api.github.com";
const OWNER = "pc-Blog";
const REPO = "next";
const BRANCH = "data";

export interface SyncProgress {
  stage: "collecting" | "blobs" | "tree" | "done" | "error";
  message: string;
  log?: string;
}

type ProgressCb = (p: SyncProgress) => void;

/** Decode base64 to UTF-8 string (browser-safe) */
function base64DecodeUtf8(base64: string): string {
  const binaryStr = atob(base64);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);
  return new TextDecoder("utf-8").decode(bytes);
}

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
async function fetchImageAsBase64(url: string): Promise<{ base64: string; mime: string; sizeMb: string }> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching image: ${url}`);
  const blob = await res.blob();
  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  const sizeMb = (bytes.length / 1024 / 1024).toFixed(1);
  return { base64: btoa(binary), mime: blob.type, sizeMb };
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
    result = result.replaceAll(originalUrl, newPath);
    if (originalUrl.startsWith("http:") || originalUrl.startsWith("https:")) {
      const protoRel = originalUrl.replace(/^https?:/, "");
      result = result.replaceAll(protoRel, newPath);
    }
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
    return { mediaItems, mediaMap };
  }

  onProgress?.({ stage: "collecting", message: `Found ${mediaRows.length} media files. Downloading...` });

  for (const media of mediaRows) {
    if (media.id == null) continue;
    try {
      const url = media.fileUrl.startsWith("http")
        ? media.fileUrl
        : `${apiBase}${media.fileUrl}`;
      const { base64, mime } = await fetchImageAsBase64(url);
      const ext = mimeToExt(mime) || extFromFilename(media.originalFilename) || ".bin";
      const filename = `${media.id}${ext}`;
      mediaItems.push({ id: media.id, filename, base64 });
      mediaMap.set(media.id, { newPath: `/next/data/media/${filename}`, originalUrl: media.fileUrl });
    } catch {
      console.warn("Failed to download media:", media.id, media.fileUrl);
    }
  }

  return { mediaItems, mediaMap };
}

// ── Music sync ──────────────────────────────────────────────

interface MusicFile {
  path: string;
  content: string;
  originalUrl: string;
  newPath: string;
}

async function collectMusic(
  apiBase: string,
  onProgress?: ProgressCb
): Promise<{ musicData: unknown; audioFiles: MusicFile[] }> {
  const res = await fetch(`${apiBase}/op/music/page`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pageNum: 1, pageSize: 999 }),
  });
  const body = await res.json() as { code: number; data?: { total: number; rows: OpMusic[] } };
  const rows = body.data?.rows || [];
  onProgress?.({ stage: "collecting", message: `Found ${rows.length} tracks. Downloading...` });

  let dlCount = 0;
  const audioFiles: MusicFile[] = [];

  for (const track of rows) {
    if (track.id == null) continue;

    if (track.url) {
      try {
        const url = track.url.startsWith("http") ? track.url : `${apiBase}${track.url}`;
        const { base64, sizeMb } = await fetchImageAsBase64(url);
        dlCount++;
        audioFiles.push({
          path: `music/${track.id}.mp3`,
          content: base64,
          originalUrl: track.url,
          newPath: `/next/data/music/${track.id}.mp3`,
        });
        onProgress?.({ stage: "collecting", message: `Downloading music...`, log: `[audio ${dlCount}] ${track.title} (${sizeMb} MB)` });
      } catch { /* skip */ }
    }

    if (track.pictureUrl) {
      try {
        const url = track.pictureUrl.startsWith("http") ? track.pictureUrl : `${apiBase}${track.pictureUrl}`;
        const { base64, mime } = await fetchImageAsBase64(url);
        const ext = mimeToExt(mime) || ".png";
        dlCount++;
        const sizeKb = Math.round(base64.length * 3 / 4 / 1024);
        audioFiles.push({
          path: `music/${track.id}-cover${ext}`,
          content: base64,
          originalUrl: track.pictureUrl,
          newPath: `/next/data/music/${track.id}-cover${ext}`,
        });
        onProgress?.({ stage: "collecting", message: `Downloading music...`, log: `[cover ${dlCount}] ${track.title} (${sizeKb} KB)` });
      } catch { /* skip */ }
    }
  }

  return { musicData: body.data, audioFiles };
}

// Collect all data from Java backend
async function collectAllData(ghToken?: string): Promise<{ path: string; content: string }[]> {
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

  const dash = await apiGet<Record<string, any>>("/dashboard");
  // 如果有 GitHub token，获取 GitHub 评论数覆盖 commentCount
  if (ghToken) {
    try {
      const res = await fetch("https://api.github.com/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${ghToken}` },
        body: JSON.stringify({
          query: `query{repository(owner:"pc-Blog",name:"next"){discussions(first:50,categoryId:"DIC_kwDOSk99g84C9uoJ"){nodes{comments{totalCount}}}}}`,
        }),
      });
      const json: any = await res.json();
      const nodes = json?.data?.repository?.discussions?.nodes;
      if (nodes) {
        dash.commentCount = nodes.reduce((s: number, n: any) => s + n.comments.totalCount, 0);
      }
    } catch { /* skip */ }
  }
  files.push({ path: "dashboard.json", content: JSON.stringify(dash, null, 2) });

  const about = await apiGet<unknown>("/about");
  files.push({ path: "about.json", content: JSON.stringify(about, null, 2) });

  const cats = await apiPost<unknown, unknown>("/category/page", PAGE);
  files.push({ path: "categories.json", content: JSON.stringify(cats, null, 2) });

  const tags = await apiPost<unknown, unknown>("/tag/page", PAGE);
  files.push({ path: "tags.json", content: JSON.stringify(tags, null, 2) });

  const tl = await apiPost<unknown, unknown>("/timeline/page", PAGE);
  files.push({ path: "timeline.json", content: JSON.stringify(tl, null, 2) });

  const skills = await apiPost<unknown, unknown>("/skill/page", PAGE);
  files.push({ path: "skills.json", content: JSON.stringify(skills, null, 2) });

  const articleList = await apiPost<{ total: number; rows: { id: number }[] }, unknown>(
    "/article/public/page", PAGE
  );
  files.push({ path: "articles.json", content: JSON.stringify(articleList, null, 2) });
  for (const a of articleList.rows) {
    try {
      const detail = await apiGet<unknown>(`/article/public/${a.id}`);
      files.push({ path: `articles/${a.id}.json`, content: JSON.stringify(detail, null, 2) });
    } catch { /* skip */ }
  }

  const projectList = await apiPost<{ total: number; rows: { id: number }[] }, unknown>(
    "/project/public/page", PAGE
  );
  files.push({ path: "projects.json", content: JSON.stringify(projectList, null, 2) });
  for (const p of projectList.rows) {
    try {
      const detail = await apiGet<unknown>(`/project/public/${p.id}`);
      files.push({ path: `projects/${p.id}.json`, content: JSON.stringify(detail, null, 2) });
    } catch { /* skip */ }
  }

  try {
    const media = await apiPost<unknown, unknown>("/media/page", { pageNum: 1, pageSize: 999 });
    files.push({ path: "media.json", content: JSON.stringify(media, null, 2) });
  } catch { /* skip */ }

  try {
    const comments = await apiPost<unknown, unknown>("/comment/page", PAGE);
    files.push({ path: "comments.json", content: JSON.stringify(comments, null, 2) });
  } catch { /* skip */ }

  // Album / Gallery data
  try {
    const albums = await apiGet<any[]>("/album/list");
    files.push({ path: "albums.json", content: JSON.stringify(albums, null, 2) });
    // Collect photos for each album
    for (const a of albums || []) {
      try {
        const photos = await apiGet<unknown>(`/photo/by-album/${a.id}`);
        files.push({ path: `albums/${a.id}.json`, content: JSON.stringify(photos, null, 2) });
      } catch { /* skip */ }
    }
  } catch { /* skip */ }

  // Chatter / Moments data
  try {
    const chatters = await apiGet<unknown>("/chatter/list");
    files.push({ path: "chatters.json", content: JSON.stringify(chatters, null, 2) });
  } catch { /* skip */ }

  // Friend links
  try {
    const friendLinks = await apiGet<unknown>("/friend-link/list");
    files.push({ path: "friendLinks.json", content: JSON.stringify(friendLinks, null, 2) });
  } catch { /* skip */ }

  // Op / Literature data
  try {
    const opArticles = await apiPost<unknown, unknown>("/op/article", {});
    files.push({ path: "op-articles.json", content: JSON.stringify(opArticles, null, 2) });
  } catch { /* skip */ }

  files.push({
    path: "index.json",
    content: JSON.stringify(
      ["dashboard", "about", "articles", "projects", "categories", "tags", "timeline", "skills", "media", "comments", "music", "op-articles", "albums", "friendLinks", "chatters"],
      null, 2
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

// ── Generic partial sync (merges with existing tree) ──

interface SyncFile {
  path: string;
  content: string;
  encoding?: "utf-8" | "base64";
}

async function syncFiles(
  token: string,
  files: SyncFile[],
  message: string,
  onProgress?: ProgressCb
): Promise<SyncResult> {
  onProgress?.({ stage: "blobs", message: "Connecting to GitHub..." });
  const ref = await gh(`${GH_API}/repos/${OWNER}/${REPO}/git/ref/heads/${BRANCH}`, token);
  const currentCommit = await gh(ref.object.url, token);
  const baseTreeSha: string = currentCommit.tree.sha;

  onProgress?.({ stage: "blobs", message: `Creating ${files.length} blobs...` });
  const blobResults: { path: string; sha: string }[] = [];
  let failCount = 0;

  for (let i = 0; i < files.length; i++) {
    const f = files[i];
    try {
      const blob = await gh(`${GH_API}/repos/${OWNER}/${REPO}/git/blobs`, token, "POST", {
        content: f.content,
        encoding: f.encoding || "utf-8",
      });
      blobResults.push({ path: f.path, sha: blob.sha as string });
      onProgress?.({
        stage: "blobs",
        message: `Creating blobs (${i + 1}/${files.length})...`,
        log: `[${i + 1}/${files.length}] ${f.path} OK`,
      });
    } catch (e) {
      failCount++;
      const errMsg = e instanceof Error ? e.message.slice(0, 60) : "Unknown error";
      onProgress?.({
        stage: "blobs",
        message: `Creating blobs (${i + 1}/${files.length})...`,
        log: `[${i + 1}/${files.length}] ${f.path} FAILED (${errMsg})`,
      });
    }
  }

  if (blobResults.length === 0) {
    onProgress?.({ stage: "error", message: "All files failed to upload." });
    return { success: false, filesCount: 0, error: "All files failed to upload" };
  }

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

  onProgress?.({ stage: "tree", message: "Building tree..." });
  const baseTree = await gh(`${GH_API}/repos/${OWNER}/${REPO}/git/trees/${baseTreeSha}`, token);

  const rootPaths = new Set(rootFiles.map((b) => b.path));
  const dirPaths = new Set(dirFiles.keys());

  const treeEntries: { path: string; mode: string; type: string; sha: string }[] = [];
  for (const entry of baseTree.tree) {
    const p = entry.path as string;
    if (!rootPaths.has(p) && !dirPaths.has(p)) {
      treeEntries.push({ path: p, mode: entry.mode, type: entry.type, sha: entry.sha });
    }
  }

  for (const b of rootFiles) {
    treeEntries.push({ path: b.path, mode: "100644", type: "blob", sha: b.sha });
  }

  for (const [dir, entries] of dirFiles) {
    if (entries.length === 0) continue;
    const subTree = await gh(`${GH_API}/repos/${OWNER}/${REPO}/git/trees`, token, "POST", {
      tree: entries.map((e) => ({ path: e.path, mode: "100644", type: "blob", sha: e.sha })),
    });
    treeEntries.push({ path: dir, mode: "040000", type: "tree", sha: subTree.sha as string });
  }

  const newTree = await gh(`${GH_API}/repos/${OWNER}/${REPO}/git/trees`, token, "POST", { tree: treeEntries });

  onProgress?.({ stage: "tree", message: "Creating commit..." });
  const newCommit = await gh(`${GH_API}/repos/${OWNER}/${REPO}/git/commits`, token, "POST", {
    message,
    tree: newTree.sha,
    parents: [ref.object.sha],
  });

  onProgress?.({ stage: "done", message: "Pushing to data branch..." });
  await gh(`${GH_API}/repos/${OWNER}/${REPO}/git/refs/heads/${BRANCH}`, token, "PATCH", {
    sha: newCommit.sha as string,
    force: true,
  });

  const okCount = blobResults.length;
  const suffix = failCount > 0 ? ` (${failCount} failed)` : "";
  onProgress?.({ stage: "done", message: `Sync complete! ${okCount} files synced${suffix}.` });
  return { success: failCount === 0, commitSha: newCommit.sha as string, filesCount: okCount };
}

// ── Download existing JSON files from data branch (for media URL replacement) ──

async function getExistingJsonFiles(
  token: string,
  onProgress?: ProgressCb
): Promise<Map<string, string>> {
  const ref = await gh(`${GH_API}/repos/${OWNER}/${REPO}/git/ref/heads/${BRANCH}`, token);
  const commit = await gh(ref.object.url, token);

  const tree = await gh(
    `${GH_API}/repos/${OWNER}/${REPO}/git/trees/${commit.tree.sha}?recursive=1`,
    token
  );

  const result = new Map<string, string>();
  const entries: any[] = tree.tree || [];
  const jsonEntries = entries.filter((e: any) => e.type === "blob" && e.path.endsWith(".json"));

  onProgress?.({ stage: "collecting", message: `Downloading ${jsonEntries.length} JSON files from GitHub...` });

  for (const entry of jsonEntries) {
    try {
      const blob = await gh(entry.url, token);
      result.set(entry.path, base64DecodeUtf8(blob.content));
    } catch { /* skip */ }
  }

  return result;
}

// ── Public sync functions ──

export async function syncJson(
  token: string,
  onProgress?: ProgressCb
): Promise<SyncResult> {
  try {
    onProgress?.({ stage: "collecting", message: "Fetching data from API..." });
    const files = await collectAllData(token);
    onProgress?.({ stage: "collecting", message: `Collected ${files.length} files.` });

    const ts = new Date().toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" });
    return await syncFiles(
      token,
      files.map((f) => ({ ...f, encoding: "utf-8" as const })),
      `${ts} sync json data`,
      onProgress
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    onProgress?.({ stage: "error", message: msg });
    return { success: false, filesCount: 0, error: msg };
  }
}

export async function syncMedia(
  token: string,
  onProgress?: ProgressCb
): Promise<SyncResult> {
  try {
    const apiBase =
      typeof window !== "undefined"
        ? process.env.NEXT_PUBLIC_API_BASE || "http://localhost:18016/api"
        : "http://localhost:18016/api";

    onProgress?.({ stage: "collecting", message: "Fetching media from API..." });
    const { mediaItems, mediaMap } = await collectMedia(apiBase, onProgress);

    if (mediaItems.length === 0) {
      onProgress?.({ stage: "done", message: "No media files to sync." });
      return { success: true, filesCount: 0 };
    }

    onProgress?.({ stage: "collecting", message: "Fetching existing JSON files from GitHub..." });
    const existingFiles = await getExistingJsonFiles(token, onProgress);

    onProgress?.({ stage: "collecting", message: "Replacing media URLs in JSON files..." });
    const files: SyncFile[] = [];

    for (const [path, content] of existingFiles) {
      const patched = replaceMediaUrls(content, mediaMap);
      files.push({ path, content: patched, encoding: "utf-8" });
    }

    for (const m of mediaItems) {
      files.push({ path: `media/${m.filename}`, content: m.base64, encoding: "base64" });
    }

    const ts = new Date().toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" });
    return await syncFiles(token, files, `${ts} sync media (${mediaItems.length} images)`, onProgress);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    onProgress?.({ stage: "error", message: msg });
    return { success: false, filesCount: 0, error: msg };
  }
}

export async function syncMusic(
  token: string,
  onProgress?: ProgressCb
): Promise<SyncResult> {
  try {
    const apiBase =
      typeof window !== "undefined"
        ? process.env.NEXT_PUBLIC_API_BASE || "http://localhost:18016/api"
        : "http://localhost:18016/api";

    onProgress?.({ stage: "collecting", message: "Fetching music from API..." });
    const { musicData, audioFiles } = await collectMusic(apiBase, onProgress);

    if (audioFiles.length === 0) {
      onProgress?.({ stage: "done", message: "No music files to sync." });
      return { success: true, filesCount: 0 };
    }

    let patched = JSON.stringify(musicData);
    for (const af of audioFiles) {
      patched = patched.replaceAll(af.originalUrl, af.newPath);
      if (af.originalUrl.startsWith("http:") || af.originalUrl.startsWith("https:")) {
        patched = patched.replaceAll(af.originalUrl.replace(/^https?:/, ""), af.newPath);
      }
    }

    const files: SyncFile[] = [
      { path: "music.json", content: JSON.stringify(JSON.parse(patched), null, 2), encoding: "utf-8" },
    ];
    for (const af of audioFiles) {
      files.push({ path: af.path, content: af.content, encoding: "base64" });
    }

    const ts = new Date().toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" });
    return await syncFiles(token, files, `${ts} sync music (${audioFiles.length} files)`, onProgress);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    onProgress?.({ stage: "error", message: msg });
    return { success: false, filesCount: 0, error: msg };
  }
}

// ── Manual sync — export data as a ZIP + standalone BAT ──

export async function generateSyncZip(
  onProgress?: ProgressCb,
  token?: string
): Promise<{ blob: Blob; name: string; batContent: string }> {
  const apiBase =
    typeof window !== "undefined"
      ? process.env.NEXT_PUBLIC_API_BASE || "http://localhost:18016/api"
      : "http://localhost:18016/api";

  // 1. Collect JSON
  onProgress?.({ stage: "collecting", message: "Fetching JSON data..." });
  const jsonFiles = await collectAllData(token);
  onProgress?.({ stage: "collecting", message: `Collected ${jsonFiles.length} JSON files.` });

  // 2. Collect media
  onProgress?.({ stage: "collecting", message: "Downloading media files..." });
  const { mediaItems, mediaMap } = await collectMedia(apiBase, onProgress);

  // 3. Collect music
  onProgress?.({ stage: "collecting", message: "Downloading music files..." });
  const { musicData, audioFiles } = await collectMusic(apiBase, onProgress);

  // 4. Build ZIP
  onProgress?.({ stage: "collecting", message: "Creating ZIP..." });

  const JSZip = (await import("jszip")).default;
  const zip = new JSZip();
  const folder = "sync-data";

  // JSON files with URL replacements
  for (const f of jsonFiles) {
    const content = mediaMap.size > 0 ? replaceMediaUrls(f.content, mediaMap) : f.content;
    zip.file(`${folder}/${f.path}`, content);
  }

  // Media files
  for (const m of mediaItems) {
    zip.file(`${folder}/media/${m.filename}`, m.base64, { base64: true });
  }

  // Music
  const musicJson = buildMusicJson(musicData, audioFiles);
  if (musicJson) {
    zip.file(`${folder}/music.json`, JSON.stringify(musicJson, null, 2));
  }
  for (const af of audioFiles) {
    zip.file(`${folder}/${af.path}`, af.content, { base64: true });
  }

  // ── Generate ZIP ──
  onProgress?.({ stage: "collecting", message: "Compressing..." });
  const blob = await zip.generateAsync({ type: "blob" });
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const name = `sync-data-${timestamp}.zip`;

  // ── Standalone sync.bat (double-click, auto-extracts ZIP) ──
  // Strategy: split into 3 small commits+pushes to avoid 408 timeout
  const batContent = [
    '@echo off',
    'chcp 65001 >nul',
    'cd /d "%~dp0"',
    '',
    'echo [1/5] 解压数据文件...',
    `powershell -Command "Expand-Archive -Path '${name}' -DestinationPath '.' -Force" >nul 2>nul`,
    'cd sync-data',
    '',
    'echo [2/5] 初始化仓库...',
    'git init',
    'git remote add origin https://github.com/pc-Blog/next.git',
    'git fetch origin data --depth=1 2>nul || echo 无已有 data 分支',
    'git checkout origin/data -- .github/ 2>nul || echo 无工作流文件需保留',
    'git checkout -b data',
    '',
    'echo [3/5] 提交 JSON 数据并推送...',
    'git add .github/',
    'for %%f in (*.json) do git add "%%f"',
    'git add articles/ projects/ 2>nul',
    'git commit -m "manual sync: json %date% %time%"',
    'git push origin data --force',
    'if %errorlevel% neq 0 (echo JSON 推送失败！ & pause & exit /b 1)',
    '',
    'echo [4/5] 提交媒体文件并推送...',
    'if exist media\\ (git add media/ & git commit -m "manual sync: media %date% %time%" & git push origin data --force)',
    'if %errorlevel% neq 0 (echo 媒体文件推送失败！ & pause & exit /b 1)',
    '',
    'echo [5/5] 提交音乐文件并推送...',
    'if exist music\\ (git add music.json music/ 2>nul & git commit -m "manual sync: music %date% %time%" & git push origin data --force)',
    'if %errorlevel% neq 0 (echo 音乐文件推送失败！ & pause & exit /b 1)',
    '',
    'echo.',
    'echo 同步完成!',
    'pause',
  ].join('\r\n');

  onProgress?.({ stage: "done", message: `ZIP ready: ${name}` });
  return { blob, name, batContent };
}

function buildMusicJson(
  musicData: unknown,
  audioFiles: MusicFile[]
): unknown | null {
  if (!musicData || audioFiles.length === 0) return null;
  let patched = JSON.stringify(musicData);
  for (const af of audioFiles) {
    patched = patched.replaceAll(af.originalUrl, af.newPath);
    if (af.originalUrl.startsWith("http:") || af.originalUrl.startsWith("https:")) {
      patched = patched.replaceAll(af.originalUrl.replace(/^https?:/, ""), af.newPath);
    }
  }
  return JSON.parse(patched);
}
