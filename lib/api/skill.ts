import api from "@/lib/axios";
import type { Skill } from "@/lib/types";

export async function getList() {
  return api.get<Skill[], Skill[]>("/skill/list");
}
