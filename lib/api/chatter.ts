import api from "@/lib/axios";
import type { PageVO, Chatter, PageDTO } from "@/lib/types";
import { detectMode, ensureData } from "@/lib/static-data";

export async function getPublishedList() {
  if ((await detectMode()) === "static") {
    const data = await ensureData<PageVO<Chatter>>("chatters");
    return (data?.rows ?? []).filter((c) => c.isPublished !== 0);
  }
  return api.get<Chatter[], Chatter[]>("/chatter/list");
}

export async function getList(keyword?: string, pageNum = 1, pageSize = 20) {
  if ((await detectMode()) === "static") {
    return (await ensureData<PageVO<Chatter>>("chatters")) ?? { rows: [], total: 0 };
  }
  return api.post<PageVO<Chatter>, PageVO<Chatter>>("/chatter/page", {
    pageNum, pageSize,
    query: keyword ? ({ content: keyword } as Chatter) : undefined,
  } satisfies PageDTO<Chatter>);
}

export async function create(data: Chatter) { return api.post("/chatter", data); }
export async function update(data: Chatter) { return api.put("/chatter", data); }
export async function remove(id: number) { return api.delete(`/chatter/${id}`); }
