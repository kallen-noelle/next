import api from "@/lib/axios";

export type AboutMap = Record<string, string>;

export async function get() {
  return api.get<AboutMap, AboutMap>("/about");
}

export async function update(data: AboutMap) {
  return api.put<AboutMap, AboutMap>("/about", data);
}
