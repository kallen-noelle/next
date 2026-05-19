import api from "@/lib/axios";
import type { PageVO, ArticleVO, ArticleDetailVO, ArticleQueryDTO, PageDTO } from "@/lib/types";

export async function getPublicList(params: PageDTO<ArticleQueryDTO>) {
  return api.post<PageVO<ArticleVO>, PageVO<ArticleVO>>("/article/public/page", params);
}

export async function getPublicDetail(id: number) {
  return api.get<ArticleDetailVO, ArticleDetailVO>(`/article/public/${id}`);
}

export async function addView(id: number) {
  return api.put<void, void>(`/article/${id}/view`);
}

export async function getById(id: number) {
  return api.get("/article/{id}".replace("{id}", String(id)));
}
