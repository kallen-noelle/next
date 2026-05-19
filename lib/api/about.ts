import api from "@/lib/axios";
import type { About } from "@/lib/types";

export async function get() {
  return api.get<About, About>("/about");
}

export async function update(data: Partial<About>) {
  return api.put("/about", data);
}
