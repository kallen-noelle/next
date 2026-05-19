import api from "@/lib/axios";
import type { DashboardVO } from "@/lib/types";

export async function get() {
  return api.get<DashboardVO, DashboardVO>("/dashboard");
}
