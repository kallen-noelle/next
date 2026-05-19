import api from "@/lib/axios";
import type { Skill } from "@/lib/types";

export async function getList() {
  return api.get<Skill[], Skill[]>("/skill/list");
}

export async function create(data: Skill) { return api.post("/skill", data); }
export async function update(data: Skill) { return api.put("/skill", data); }
export async function remove(id: number) { return api.delete(`/skill/${id}`); }
