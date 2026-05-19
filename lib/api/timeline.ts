import api from "@/lib/axios";
import type { Timeline } from "@/lib/types";

export async function getList() {
  return api.get<Timeline[], Timeline[]>("/timeline/list");
}

export async function create(data: Timeline) { return api.post("/timeline", data); }
export async function update(data: Timeline) { return api.put("/timeline", data); }
export async function remove(id: number) { return api.delete(`/timeline/${id}`); }
