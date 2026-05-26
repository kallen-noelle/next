import api from "@/lib/axios";
import type { PageVO, Media, PageDTO } from "@/lib/types";
import { getPublicList as getArticleList, getPublicDetail as getArticleDetail } from "./article";
import { getPublicList as getProjectList, getPublicDetail as getProjectDetail } from "./project";
import { get as getAbout } from "./about";

export async function getList(params: PageDTO<Media>) {
  return api.post<PageVO<Media>, PageVO<Media>>("/media/page", params);
}

export async function upload(file: File) {
  const form = new FormData();
  form.append("file", file);
  return api.post("/media/upload", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
}

export async function remove(id: number) {
  return api.delete(`/media/${id}`);
}

export interface MediaRef {
  type: "article" | "project" | "about";
  title: string;
  id?: number;
  field: "coverImage" | "content";
}

export interface MediaWithRef {
  media: Media;
  refs: MediaRef[];
}

/** Scan the backend and return every media file with where it is referenced (or empty if orphan) */
export async function scanMediaWithRefs(): Promise<{
  items: MediaWithRef[];
  totalMedia: number;
  orphanCount: number;
}> {
  // 1. Fetch all media records
  const mediaRes = await getList({ pageNum: 1, pageSize: 999 });
  const allMedia = mediaRes.rows;

  // 2. Collect reference sources with metadata
  type RefSource = { text: string; type: MediaRef["type"]; title: string; id?: number; field: MediaRef["field"] };
  const sources: RefSource[] = [];

  // 2a. Articles
  const articles = await getArticleList({ pageNum: 1, pageSize: 999 });
  for (const a of articles.rows) {
    if (a.coverImage) sources.push({ text: a.coverImage, type: "article", title: a.title, id: a.id, field: "coverImage" });
    try {
      const detail = await getArticleDetail(a.id);
      if (detail?.content) sources.push({ text: detail.content, type: "article", title: a.title, id: a.id, field: "content" });
    } catch { /* skip */ }
  }

  // 2b. Projects
  const projects = await getProjectList({ pageNum: 1, pageSize: 999 });
  for (const p of projects.rows) {
    if (p.coverImage) sources.push({ text: p.coverImage, type: "project", title: p.name, id: p.id, field: "coverImage" });
    try {
      const detail = await getProjectDetail(p.id);
      if (detail?.content) sources.push({ text: detail.content, type: "project", title: p.name, id: p.id, field: "content" });
    } catch { /* skip */ }
  }

  // 2c. About
  try {
    const about = await getAbout();
    for (const val of Object.values(about)) {
      if (val) sources.push({ text: val, type: "about", title: "About", field: "content" });
    }
  } catch { /* skip */ }

  // 3. For each media, check all sources
  let orphanCount = 0;
  const items: MediaWithRef[] = allMedia.map((m) => {
    const refs: MediaRef[] = [];
    for (const s of sources) {
      if (s.text.includes(m.fileUrl)) {
        refs.push({ type: s.type, title: s.title, id: s.id, field: s.field });
      }
    }
    if (refs.length === 0) orphanCount++;
    return { media: m, refs };
  });

  return { items, totalMedia: allMedia.length, orphanCount };
}
