import api from "@/lib/axios";
import type { PageVO, Skill, PageDTO } from "@/lib/types";
import { detectMode, ensureData } from "@/lib/static-data";

export async function getList(keyword?: string, pageNum = 1, pageSize = 20) {
  if ((await detectMode()) === "static") {
    return (await ensureData<PageVO<Skill>>("skills")) ?? { rows: [], total: 0 };
  }
  return api.post<PageVO<Skill>, PageVO<Skill>>("/skill/page", {
    pageNum,
    pageSize,
    query: keyword ? ({ name: keyword } as Skill) : undefined,
  } satisfies PageDTO<Skill>);
}

export async function create(data: Skill) { return api.post("/skill", data); }
export async function update(data: Skill) { return api.put("/skill", data); }
export async function remove(id: number) { return api.delete(`/skill/${id}`); }
