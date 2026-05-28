import api from "@/lib/axios";
import type { OpArticle, OpMusic, PageVO, OpTag } from "@/lib/types";
import { detectMode, ensureData } from "@/lib/static-data";

export async function getArticleList() {
  if ((await detectMode()) === "static") {
    return (await ensureData<PageVO<OpTag>>("op-articles")) ?? { rows: [], total: 0 };
  }
  return api.post<PageVO<OpTag>, PageVO<OpTag>>("/op/article");
}

export async function getMusic() {
  if ((await detectMode()) === "static") {
    const data = await ensureData<PageVO<OpMusic>>("music");
    if (!data || !data.rows || data.rows.length === 0) return null;
    return data.rows[Math.floor(Math.random() * data.rows.length)];
  }
  return api.get<OpMusic, OpMusic>("/op/music");
}
