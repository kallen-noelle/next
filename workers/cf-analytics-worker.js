// Cloudflare Worker — 博客流量分析 API 代理
// 返回 lib/analytics.ts 中 AnalyticsData 格式的完整数据

// ── 并发控制：将数组分片并行执行 ──
async function pMapSerial(items, concurrency, fn) {
  const results = [];
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency).map((item, idx) =>
      fn(item, i + idx).catch(() => null)
    );
    const batchResults = await Promise.all(batch);
    results.push(...batchResults);
  }
  return results;
}

// ── SHA-256 hash（用于缓存 key） ──
async function sha256(message) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  return [...new Uint8Array(hashBuffer)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// ── 查询：每日 + 小时 ──
function buildDailyHourlyQuery(zoneId, days) {
  const endDate = new Date();
  const startDate = new Date(Date.now() - days * 86400000);
  const startStr = startDate.toISOString().slice(0, 10);
  const endStr = endDate.toISOString().slice(0, 10);
  const hStart = new Date(Math.max(startDate.getTime(), Date.now() - 3 * 86400000));
  const hStartDt = hStart.toISOString().replace(/\.\d{3}Z$/, "Z");
  const endDt = endDate.toISOString().replace(/\.\d{3}Z$/, "Z");

  return `{
    viewer {
      zones(filter: {zoneTag: "${zoneId}"}) {
        daily: httpRequests1dGroups(limit: ${Math.min(days + 1, 365)}, filter: {date_geq: "${startStr}", date_leq: "${endStr}"}, orderBy: [date_ASC]) {
          dimensions { date }
          sum { requests cachedRequests cachedBytes bytes pageViews }
          uniq { uniques }
        }
        hourly: httpRequests1hGroups(limit: 120, filter: {datetime_gt: "${hStartDt}", datetime_lt: "${endDt}"}, orderBy: [datetime_ASC]) {
          dimensions { datetime }
          sum { requests cachedRequests bytes pageViews }
          uniq { uniques }
        }
      }
    }
  }`;
}

// ── 查询：某一天的细分数据（修正版，用毫秒时间戳确保精确 24 小时范围） ──
function buildBreakdownQuery(zoneId, dateStr) {
  const startMs = new Date(dateStr).getTime();
  const endMs = startMs + 86400000;
  return `{
    viewer {
      zones(filter: {zoneTag: "${zoneId}"}) {
        byCountry: httpRequestsAdaptiveGroups(limit: 100, filter: {datetime_geq: "${new Date(startMs).toISOString()}", datetime_lt: "${new Date(endMs).toISOString()}"}, orderBy: [count_DESC]) {
          count dimensions { clientCountryName }
        }
        byDevice: httpRequestsAdaptiveGroups(limit: 10, filter: {datetime_geq: "${new Date(startMs).toISOString()}", datetime_lt: "${new Date(endMs).toISOString()}"}, orderBy: [count_DESC]) {
          count dimensions { clientDeviceType }
        }
        byBrowser: httpRequestsAdaptiveGroups(limit: 10, filter: {datetime_geq: "${new Date(startMs).toISOString()}", datetime_lt: "${new Date(endMs).toISOString()}"}, orderBy: [count_DESC]) {
          count dimensions { userAgentBrowser }
        }
        byOS: httpRequestsAdaptiveGroups(limit: 10, filter: {datetime_geq: "${new Date(startMs).toISOString()}", datetime_lt: "${new Date(endMs).toISOString()}"}, orderBy: [count_DESC]) {
          count dimensions { userAgentOS }
        }
        byCache: httpRequestsAdaptiveGroups(limit: 10, filter: {datetime_geq: "${new Date(startMs).toISOString()}", datetime_lt: "${new Date(endMs).toISOString()}"}, orderBy: [count_DESC]) {
          count dimensions { cacheStatus }
        }
        byHTTP: httpRequestsAdaptiveGroups(limit: 10, filter: {datetime_geq: "${new Date(startMs).toISOString()}", datetime_lt: "${new Date(endMs).toISOString()}"}, orderBy: [count_DESC]) {
          count dimensions { clientRequestHTTPProtocol }
        }
      }
    }
  }`;
}

// ── 累计细分数据到 Map ──
function accumulateGroups(z, map) {
  for (const key of ["byCountry", "byDevice", "byBrowser", "byOS", "byCache", "byHTTP"]) {
    const groups = z[key] || [];
    for (const item of groups) {
      const dimKey = key === "byCountry" ? "clientCountryName"
        : key === "byDevice" ? "clientDeviceType"
        : key === "byBrowser" ? "userAgentBrowser"
        : key === "byOS" ? "userAgentOS"
        : key === "byCache" ? "cacheStatus"
        : "clientRequestHTTPProtocol";
      const name = item.dimensions[dimKey] || "Unknown";
      map[key].set(name, (map[key].get(name) || 0) + item.count);
    }
  }
}

function toBreakdown(map) {
  const total = [...map.values()].reduce((s, v) => s + v, 0);
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value, pct: total ? Math.round((value / total) * 1000) / 10 : 0 }));
}

function corsHeaders(origin) {
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

async function callCF(query, env) {
  const resp = await fetch("https://api.cloudflare.com/client/v4/graphql", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${env.CF_API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  });
  const json = await resp.json();
  if (!resp.ok) throw new Error(`Cloudflare HTTP ${resp.status}: ${JSON.stringify(json)}`);
  if (json.errors) throw new Error(`Cloudflare GraphQL error: ${JSON.stringify(json.errors)}`);
  return json;
}

// ── 解析每日 + 小时数据 ──
function parseDailyHourly(json) {
  const zones = json?.data?.viewer?.zones || [];
  const zone = zones[0] || {};

  const totals = { requests: 0, cachedRequests: 0, cachedBytes: 0, bytes: 0, pageViews: 0, uniques: 0 };

  const daily = (zone.daily || []).map((day) => {
    const req = day.sum.requests;
    const cached = day.sum.cachedRequests;
    const cachedBw = day.sum.cachedBytes;
    const bw = day.sum.bytes;
    const pv = day.sum.pageViews;
    const uv = day.uniq.uniques;
    totals.requests += req;
    totals.cachedRequests += cached;
    totals.cachedBytes += cachedBw;
    totals.bytes += bw;
    totals.pageViews += pv;
    totals.uniques += uv;
    return {
      date: day.dimensions.date,
      requests: req,
      uniqueVisitors: uv,
      pageViews: pv,
      cachedRequests: cached,
      cacheHitRate: req ? Math.round((cached / req) * 10000) / 100 : 0,
      cacheHitRateBytes: bw ? Math.round((cachedBw / bw) * 10000) / 100 : 0,
      bandwidthBytes: bw,
      bandwidthMB: Math.round((bw / 1024 / 1024) * 100) / 100,
    };
  });

  const hourly = (zone.hourly || []).map((h) => {
    const req = h.sum.requests;
    const cached = h.sum.cachedRequests;
    const bw = h.sum.bytes;
    const pv = h.sum.pageViews;
    const uv = h.uniq.uniques;
    return {
      datetime: h.dimensions.datetime,
      requests: req,
      uniqueVisitors: uv,
      pageViews: pv,
      cachedRequests: cached,
      cacheHitRate: req ? Math.round((cached / req) * 10000) / 100 : 0,
      bandwidthBytes: bw,
      bandwidthMB: Math.round((bw / 1024 / 1024) * 100) / 100,
    };
  });

  const totalCacheRate = totals.requests ? Math.round((totals.cachedRequests / totals.requests) * 10000) / 100 : 0;
  const totalCacheRateBytes = totals.bytes ? Math.round((totals.cachedBytes / totals.bytes) * 10000) / 100 : 0;

  return {
    daily,
    hourly,
    totals: {
      requests: totals.requests,
      uniqueVisitors: totals.uniques,
      pageViews: totals.pageViews,
      cacheHitRate: totalCacheRate,
      cacheHitRateBytes: totalCacheRateBytes,
      bandwidthMB: Math.round((totals.bytes / 1024 / 1024) * 100) / 100,
    },
  };
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") || "*";

    // OPTIONS 预检
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    // Ping 测试
    if (request.method === "GET" && url.pathname === "/ping") {
      return new Response(JSON.stringify({ status: "ok", message: "Worker is alive" }), {
        headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
      });
    }

    // POST — 获取完整分析数据
    if (request.method === "POST") {
      try {
        const body = await request.json();
        const days = Math.min(body?.days || 7, 364);

        // ── 缓存检查：POST body 的 SHA-256 作为缓存 key ──
        const cache = caches.default;
        const bodyText = JSON.stringify(body);
        const hash = await sha256(bodyText);
        const cacheUrl = new URL(request.url);
        cacheUrl.pathname = "/analytics/" + hash;
        const cacheKey = new Request(cacheUrl.toString(), { method: "GET" });

        let cached = await cache.match(cacheKey);
        if (cached) {
          const data = await cached.json();
          data._cache = "hit";
          data._cachedAt = new Date().toISOString();
          return new Response(JSON.stringify(data), {
            headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
          });
        }

        // 1. 拉取每日 + 小时数据
        const dhJson = await callCF(buildDailyHourlyQuery(env.CF_ZONE_ID, days), env);
        const { daily, hourly, totals } = parseDailyHourly(dhJson);

        // 2. 并行拉取细分数据（最多 30 天，并发 5 路）
        const breakdownDays = Math.min(days, 30);
        const maps = { byCountry: new Map(), byDevice: new Map(), byBrowser: new Map(), byOS: new Map(), byCache: new Map(), byHTTP: new Map() };
        const startDate = new Date(Date.now() - breakdownDays * 86400000);
        const dayDates = Array.from({ length: breakdownDays }, (_, i) => {
          const d = new Date(startDate.getTime() + i * 86400000);
          return d.toISOString().slice(0, 10);
        });

        const zones = await pMapSerial(dayDates, 5, async (dateStr) => {
          const bJson = await callCF(buildBreakdownQuery(env.CF_ZONE_ID, dateStr), env);
          return bJson?.data?.viewer?.zones?.[0] || null;
        });
        for (const z of zones) {
          if (z) accumulateGroups(z, maps);
        }

        // 3. 组装完整响应
        const result = {
          daily,
          hourly,
          totals,
          byCountry: toBreakdown(maps.byCountry),
          byDevice: toBreakdown(maps.byDevice),
          byBrowser: toBreakdown(maps.byBrowser),
          byOS: toBreakdown(maps.byOS),
          byCacheStatus: toBreakdown(maps.byCache),
          byHTTPProtocol: toBreakdown(maps.byHTTP),
          generatedAt: new Date().toISOString(),
          _cache: "miss",
        };

        const response = new Response(JSON.stringify(result), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
        });

        // 异步写入缓存，1 小时过期（不阻塞响应）
        const cacheResponse = new Response(response.clone().body, {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "public, max-age=3600",
            ...corsHeaders(origin),
          },
        });
        ctx.waitUntil(cache.put(cacheKey, cacheResponse));

        return response;
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
        });
      }
    }

    return new Response("Not Found", { status: 404, headers: corsHeaders(origin) });
  },
};
