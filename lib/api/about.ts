import api from "@/lib/axios";
import { detectMode, ensureData } from "@/lib/static-data";

export type AboutMap = Record<string, string>;

export async function get() {
  if ((await detectMode()) === "static") {
    return (await ensureData<AboutMap>("about")) ?? {};
  }
  return api.get<AboutMap, AboutMap>("/about");
}

export async function update(data: AboutMap) {
  return api.put<AboutMap, AboutMap>("/about", data);
}
