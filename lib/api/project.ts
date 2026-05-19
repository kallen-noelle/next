import api from "@/lib/axios";
import type { PageVO, ProjectVO, ProjectDetailVO, PageDTO } from "@/lib/types";

export async function getPublicList(params: PageDTO<Record<string, unknown>>) {
  return api.post<PageVO<ProjectVO>, PageVO<ProjectVO>>("/project/public/page", params);
}

export async function getPublicDetail(id: number) {
  return api.get<ProjectDetailVO, ProjectDetailVO>(`/project/public/${id}`);
}

export async function getById(id: number) {
  return api.get("/project/{id}".replace("{id}", String(id)));
}
