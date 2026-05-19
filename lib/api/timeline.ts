import api from "@/lib/axios";
import type { PageVO, Timeline, PageDTO } from "@/lib/types";

export async function getList(keyword?: string, pageNum = 1, pageSize = 20) {
  return api.post<PageVO<Timeline>, PageVO<Timeline>>("/timeline/page", {
    pageNum,
    pageSize,
    query: keyword ? ({ title: keyword } as Timeline) : undefined,
  } satisfies PageDTO<Timeline>);
}

export async function create(data: Timeline) { return api.post("/timeline", data); }
export async function update(data: Timeline) { return api.put("/timeline", data); }
export async function remove(id: number) { return api.delete(`/timeline/${id}`); }
