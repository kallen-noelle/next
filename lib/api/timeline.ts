import api from "@/lib/axios";
import type { Timeline } from "@/lib/types";

export async function getList() {
  return api.get<Timeline[], Timeline[]>("/timeline/list");
}
