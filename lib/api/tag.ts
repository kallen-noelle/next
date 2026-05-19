import api from "@/lib/axios";
import type { PageVO, Tag, PageDTO } from "@/lib/types";

export async function getList() {
  return api.post<PageVO<Tag>, PageVO<Tag>>("/tag/page", {
    pageNum: 1,
    pageSize: 200,
  } satisfies PageDTO<Tag>);
}

export async function create(data: Tag) {
  return api.post("/tag", data);
}

export async function update(data: Tag) {
  return api.put("/tag", data);
}

export async function remove(id: number) {
  return api.delete(`/tag/${id}`);
}
