import api from "@/lib/axios";
import type { PageVO, Article, ArticleVO, ArticleDetailVO, ArticleQueryDTO, PageDTO } from "@/lib/types";
import { detectMode, ensureData, getDetailData } from "@/lib/static-data";

export async function getPublicList(params: PageDTO<ArticleQueryDTO>) {
  if ((await detectMode()) === "static") {
    const all = await ensureData<PageVO<ArticleVO>>("articles");
    if (!all) return { rows: [], total: 0 };

    let filtered = all.rows;
    const q = params.query;
    if (q?.categoryId) filtered = filtered.filter((a) => a.categoryId === q.categoryId);
    if (q?.tagId) filtered = filtered.filter((a) => a.tags?.some((t) => t.id === q.tagId));
    if (q?.keyword) {
      const kw = q.keyword.toLowerCase();
      filtered = filtered.filter((a) => a.title.toLowerCase().includes(kw));
    }

    const pageNum = params.pageNum || 1;
    const pageSize = params.pageSize || 9;
    const start = (pageNum - 1) * pageSize;
    return { rows: filtered.slice(start, start + pageSize), total: filtered.length };
  }
  return api.post<PageVO<ArticleVO>, PageVO<ArticleVO>>("/article/public/page", params);
}

export async function getPublicDetail(id: number) {
  if ((await detectMode()) === "static") {
    return getDetailData<ArticleDetailVO>("articles", id);
  }
  return api.get<ArticleDetailVO, ArticleDetailVO>(`/article/public/${id}`);
}

const viewedInSession = new Set<number>();

export async function addView(id: number) {
  if ((await detectMode()) === "static") return;
  // prevent duplicate calls within same page load (e.g. Strict Mode)
  if (viewedInSession.has(id)) return;
  viewedInSession.add(id);
  return api.put<void, void>(`/article/${id}/view`);
}

export async function getById(id: number) {
  return api.get("/article/{id}".replace("{id}", String(id)));
}

// Admin CRUD
export async function getList(keyword?: string, pageNum = 1, pageSize = 20) {
  return api.post<PageVO<Article>, PageVO<Article>>("/article/page", {
    pageNum,
    pageSize,
    query: keyword ? ({ title: keyword } as Article) : undefined,
  } satisfies PageDTO<Article>);
}
