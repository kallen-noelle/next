import api from "@/lib/axios";
import type { DashboardVO } from "@/lib/types";
import { detectMode, ensureData } from "@/lib/static-data";

export async function get() {
  if ((await detectMode()) === "static") {
    return (await ensureData<DashboardVO>("dashboard")) ?? null;
  }
  return api.get<DashboardVO, DashboardVO>("/dashboard");
}
