import api from "@/lib/axios";
import type { OpCategory, OpArticle, OpMusic, OpArticleQuery, PageVO, PageDTO } from "@/lib/types";
import { detectMode } from "@/lib/static-data";

export async function getCategories() {
  return api.get<OpCategory[], OpCategory[]>("/op/category");
}

export async function getArticleList(params: PageDTO<OpArticleQuery>) {
  return api.post<PageVO<OpArticle>, PageVO<OpArticle>>("/op/article", params);
}

export async function getMusic() {
  if ((await detectMode()) === "static") return null;
  return api.get<OpMusic, OpMusic>("/op/music");
}
