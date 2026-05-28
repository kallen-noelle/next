import api from "@/lib/axios";
import type { PageVO, FriendLink, PageDTO } from "@/lib/types";
import { detectMode, ensureData } from "@/lib/static-data";

export async function getPublishedList() {
  if ((await detectMode()) === "static") {
    const all = await ensureData<FriendLink[]>("friendLinks");
    return (all ?? []).filter((f) => f.isPublished !== 0);
  }
  return api.get<FriendLink[], FriendLink[]>("/friend-link/list");
}

export async function getList(keyword?: string, pageNum = 1, pageSize = 20) {
  if ((await detectMode()) === "static") {
    return (await ensureData<PageVO<FriendLink>>("friendLinks")) ?? { rows: [], total: 0 };
  }
  return api.post<PageVO<FriendLink>, PageVO<FriendLink>>("/friend-link/page", {
    pageNum,
    pageSize,
    query: keyword ? ({ name: keyword } as FriendLink) : undefined,
  } satisfies PageDTO<FriendLink>);
}

export async function create(data: FriendLink) { return api.post("/friend-link", data); }
export async function update(data: FriendLink) { return api.put("/friend-link", data); }
export async function remove(id: number) { return api.delete(`/friend-link/${id}`); }
