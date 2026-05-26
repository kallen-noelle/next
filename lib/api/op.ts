import api from "@/lib/axios";
import type { OpCategory, OpArticle, OpMusic, OpArticleQuery, PageVO, PageDTO } from "@/lib/types";
import { detectMode, ensureData } from "@/lib/static-data";

export async function getCategories() {
  if ((await detectMode()) === "static") {
    return (await ensureData<OpCategory[]>("op-categories")) ?? [];
  }
  return api.get<OpCategory[], OpCategory[]>("/op/category");
}

export async function getArticleList(params: PageDTO<OpArticleQuery>) {
  if ((await detectMode()) === "static") {
    const all = await ensureData<PageVO<OpArticle>>("op-articles");
    if (!all) return { rows: [], total: 0 };

    let filtered = all.rows;
    const q = params.query;
    if (q?.tagId) filtered = filtered.filter((a) => a.tagIds?.includes(q.tagId!));
    if (q?.title) {
      const kw = q.title.toLowerCase();
      filtered = filtered.filter((a) => a.title.toLowerCase().includes(kw));
    }

    const pageNum = params.pageNum || 1;
    const pageSize = params.pageSize || 12;
    const start = (pageNum - 1) * pageSize;
    return { rows: filtered.slice(start, start + pageSize), total: filtered.length };
  }
  return api.post<PageVO<OpArticle>, PageVO<OpArticle>>("/op/article", params);
}

export async function getMusic() {
  if ((await detectMode()) === "static") {
    const data = await ensureData<PageVO<OpMusic>>("music");
    if (!data || !data.rows || data.rows.length === 0) return null;
    return data.rows[Math.floor(Math.random() * data.rows.length)];
  }
  return api.get<OpMusic, OpMusic>("/op/music");
}
