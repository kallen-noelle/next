import type {
  DailyStats,
  HourlyStats,
  Totals,
  BreakdownItem,
  RawGraphQLResponse,
} from "../types";

// ── 解析每日/逐小时数据 ──

export function parseDailyHourly(
  json: RawGraphQLResponse
): { daily: DailyStats[]; hourly: HourlyStats[]; totals: Totals } {
  const zones = json?.data?.viewer?.zones || [];
  const zone = zones[0] || {};

  const totals: Totals = {
    requests: 0,
    cacheHitRate: 0,
    cacheHitRateBytes: 0,
    pageViews: 0,
    uniqueVisitors: 0,
    bandwidthMB: 0,
  };

  // 辅助：累计 sum 字段（safe access）
  const sum = (s: Record<string, number> | undefined, key: string): number =>
    s?.[key] ?? 0;

  // 累计中间值
  let totalRequests = 0;
  let totalCached = 0;
  let totalBytes = 0;
  let totalCachedBytes = 0;
  let totalPageViews = 0;
  let totalUniques = 0;

  const daily: DailyStats[] = (zone.daily || []).map(
    (day: Record<string, any>) => {
      const s = day.sum;
      const req = sum(s, "requests");
      const cached = sum(s, "cachedRequests");
      const cachedBw = sum(s, "cachedBytes");
      const bw = sum(s, "bytes");
      const pv = sum(s, "pageViews");
      const uv = day.uniq?.uniques ?? 0;

      totalRequests += req;
      totalCached += cached;
      totalCachedBytes += cachedBw;
      totalBytes += bw;
      totalPageViews += pv;
      totalUniques += uv;

      return {
        date: day.dimensions.date,
        requests: req,
        uniqueVisitors: uv,
        pageViews: pv,
        cachedRequests: cached,
        cacheHitRate: req ? Math.round((cached / req) * 10_000) / 100 : 0,
        cacheHitRateBytes: bw
          ? Math.round((cachedBw / bw) * 10_000) / 100
          : 0,
        bandwidthBytes: bw,
        bandwidthMB: Math.round((bw / 1024 / 1024) * 100) / 100,
      };
    }
  );

  const hourly: HourlyStats[] = (zone.hourly || []).map(
    (h: Record<string, any>) => {
      const s = h.sum;
      const req = sum(s, "requests");
      const cached = sum(s, "cachedRequests");
      const bw = sum(s, "bytes");
      const pv = sum(s, "pageViews");
      const uv = h.uniq?.uniques ?? 0;

      return {
        datetime: h.dimensions.datetime,
        requests: req,
        uniqueVisitors: uv,
        pageViews: pv,
        cachedRequests: cached,
        cacheHitRate: req ? Math.round((cached / req) * 10_000) / 100 : 0,
        bandwidthBytes: bw,
        bandwidthMB: Math.round((bw / 1024 / 1024) * 100) / 100,
      };
    }
  );

  totals.requests = totalRequests;
  totals.uniqueVisitors = totalUniques;
  totals.pageViews = totalPageViews;
  totals.cacheHitRate = totalRequests
    ? Math.round((totalCached / totalRequests) * 10_000) / 100
    : 0;
  totals.cacheHitRateBytes = totalBytes
    ? Math.round((totalCachedBytes / totalBytes) * 10_000) / 100
    : 0;
  totals.bandwidthMB = Math.round((totalBytes / 1024 / 1024) * 100) / 100;

  return { daily, hourly, totals };
}

// ── 解析细分数据 ──

type BreakdownKey =
  | "byCountry"
  | "byDevice"
  | "byBrowser"
  | "byOS"
  | "byCache"
  | "byHTTP";

const DIMENSION_MAP: Record<BreakdownKey, string> = {
  byCountry: "clientCountryName",
  byDevice: "clientDeviceType",
  byBrowser: "userAgentBrowser",
  byOS: "userAgentOS",
  byCache: "cacheStatus",
  byHTTP: "clientRequestHTTPProtocol",
};

type BreakdownMaps = Record<BreakdownKey, Map<string, number>>;

export function createEmptyMaps(): BreakdownMaps {
  return {
    byCountry: new Map(),
    byDevice: new Map(),
    byBrowser: new Map(),
    byOS: new Map(),
    byCache: new Map(),
    byHTTP: new Map(),
  };
}

/**
 * 从单个 zone 的各维度的 AdaptiveGroups 累加到 maps。
 */
export function accumulateGroups(
  zone: Record<string, any>,
  maps: BreakdownMaps
): void {
  for (const key of Object.keys(DIMENSION_MAP) as BreakdownKey[]) {
    const groups = zone[key] || [];
    const dimKey = DIMENSION_MAP[key];
    for (const item of groups) {
      const name = item.dimensions?.[dimKey] || "Unknown";
      maps[key].set(name, (maps[key].get(name) || 0) + item.count);
    }
  }
}

/**
 * 将 Map 转为排序后的 BreakdownItem 数组（含百分比）。
 */
export function toBreakdown(map: Map<string, number>): BreakdownItem[] {
  const total = [...map.values()].reduce((s, v) => s + v, 0);
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({
      name,
      value,
      pct: total ? Math.round((value / total) * 1000) / 10 : 0,
    }));
}
