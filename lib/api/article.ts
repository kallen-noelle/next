import api from "@/lib/axios";
import type { PageVO, Article, ArticleVO, ArticleDetailVO, ArticleQueryDTO, PageDTO } from "@/lib/types";

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

// Admin CRUD
export async function getList(keyword?: string, pageNum = 1, pageSize = 20) {
  return api.post<PageVO<Article>, PageVO<Article>>("/article/page", {
    pageNum,
    pageSize,
    query: keyword ? ({ title: keyword } as Article) : undefined,
  } satisfies PageDTO<Article>);
}
