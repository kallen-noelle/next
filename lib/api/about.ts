import { detectMode, ensureData } from "@/lib/static-data";

export type AboutMap = Record<string, string>;

export async function get(): Promise<AboutMap> {
  if ((await detectMode()) === "static") {
    return (await ensureData<AboutMap>("about")) ?? {};
  }
  // In live mode, this would call the API
  // For now, return empty object as we're in static mode
  return {};
}

export async function update(data: AboutMap): Promise<void> {
  // No API calls in static mode
  return;
}
