import api from "@/lib/axios";
import type { PageVO, Comment, PageDTO } from "@/lib/types";

export async function getList(params: PageDTO<Comment>) {
  return api.post<PageVO<Comment>, PageVO<Comment>>("/comment/page", params);
}

export async function create(data: { articleId: number; content: string }) {
  return api.post<Comment, Comment>("/comment", data);
}
