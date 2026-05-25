import api from "@/lib/axios";
import type { OpCategory, OpArticle, OpMusic, OpArticleQuery, PageVO, PageDTO } from "@/lib/types";
import { detectMode, ensureData } from "@/lib/static-data";

export async function getCategories() {
  return api.get<OpCategory[], OpCategory[]>("/op/category");
}

export async function getArticleList(params: PageDTO<OpArticleQuery>) {
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
