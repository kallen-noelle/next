// Cloudflare Worker — 博客流量分析 API 代理
// 所有响应统一为 { code, data, msg } 格式
//
// 需在 Cloudflare 面板或 wrangler secret 中配置以下环境变量：
//   必填:
//     CF_API_TOKEN    —— Cloudflare API Token（Analytics:Read 权限）
//     CF_ZONE_ID      —— Cloudflare 区域 ID
//   选填（多平台统计 /platform 接口需要）:
//     CSDN_USER       —— CSDN 用户名
//     JUEJIN_USER_ID  —— 掘金用户 ID
//     CNBLOGS_BLOGAPP —— 博客园 blogApp

function respond(data, msg = "ok", code = 1, origin) {
  return new Response(JSON.stringify({ code, data, msg }), {
    status: code === 1 ? 200 : 500,
    headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
  });
}

function corsHeaders(origin) {
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

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

async function sha256(message) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  return [...new Uint8Array(hashBuffer)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

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

// ── 多平台统计 ──
function formatDate(ts) {
  const d = new Date(ts * 1000);
  return d.toISOString().slice(0, 10);
}

async function fetchCSDN(env) {
  if (!env.CSDN_USER) return null;
  const url = "https://blog.csdn.net/community/home-api/v1/get-business-list";
  const params = { page: 1, size: 100, businessType: "blog", username: env.CSDN_USER };
  const resp = await fetch(`${url}?${new URLSearchParams(params)}`, {
    headers: { "User-Agent": "Mozilla/5.0", Referer: `https://blog.csdn.net/${env.CSDN_USER}` },
  });
  if (!resp.ok) throw new Error(`CSDN HTTP ${resp.status}`);
  const data = await resp.json();
  const list = data?.data?.list || [];
  return {
    articleCount: list.length,
    totalViews: list.reduce((s, a) => s + (a.viewCount || 0), 0),
    totalLikes: list.reduce((s, a) => s + (a.diggCount || 0), 0),
    totalComments: list.reduce((s, a) => s + (a.commentCount || 0), 0),
    totalCollects: list.reduce((s, a) => s + (a.collectCount || 0), 0),
    articles: list.map((a) => ({
      platform: "csdn", title: a.title || "", url: a.url || "",
      date: a.createTime ? a.createTime.slice(0, 10) : "",
      views: a.viewCount || 0, likes: a.diggCount || 0,
    })),
  };
}

async function fetchJuejin(env) {
  if (!env.JUEJIN_USER_ID) return null;
  const userResp = await fetch(`https://api.juejin.cn/user_api/v1/user/get?user_id=${env.JUEJIN_USER_ID}`, {
    headers: { "User-Agent": "Mozilla/5.0" },
  });
  const userJson = await userResp.json();
  const user = userJson?.data || {};

  let allArticles = [];
  let cursor = "0";
  while (true) {
    const artResp = await fetch("https://api.juejin.cn/content_api/v1/article/query_list", {
      method: "POST",
      headers: { "Content-Type": "application/json", "User-Agent": "Mozilla/5.0" },
      body: JSON.stringify({ user_id: env.JUEJIN_USER_ID, sort_type: 2, cursor }),
    });
    const artJson = await artResp.json();
    const items = artJson?.data || [];
    if (items.length === 0) break;
    allArticles.push(...items);
    if (!artJson.has_more) break;
    cursor = String(Number(cursor) + 10);
  }

  return {
    articleCount: allArticles.length,
    totalViews: user.got_view_count || 0,
    totalLikes: user.got_digg_count || 0,
    totalCollects: allArticles.reduce((s, item) => s + ((item.article_info?.collect_count) || 0), 0),
    followers: user.follower_count || 0,
    articles: allArticles.map((item) => {
      const info = item.article_info || {};
      return {
        platform: "juejin", title: info.title || "", url: `https://juejin.cn/post/${info.article_id}`,
        date: info.ctime ? formatDate(info.ctime) : "",
        views: info.view_count || 0, likes: info.digg_count || 0,
      };
    }),
  };
}

async function fetchCnblogs(env) {
  if (!env.CNBLOGS_BLOGAPP) return null;
  const baseUrl = `https://www.cnblogs.com/${env.CNBLOGS_BLOGAPP}`;
  let allArticles = [];
  for (let page = 1; page <= 100; page++) {
    const resp = await fetch(`${baseUrl}/default.html?page=${page}`, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    if (!resp.ok) break;
    const html = await resp.text();
    const articleRegex = /<a class="postTitle2[^"]*"[^>]*href="([^"]+)"[^>]*>\s*<span>([^<]+)<\/span>/g;
    const viewRegex = /阅读\((\d+)\)/g;
    const diggRegex = /推荐\((\d+)\)/g;
    const commentRegex = /评论\((\d+)\)/g;
    const dateRegex = /posted @ (\d{4}-\d{2}-\d{2})/g;

    const titles = [...html.matchAll(articleRegex)];
    if (titles.length === 0) break;

    const views = [...html.matchAll(viewRegex)].map((m) => Number(m[1]));
    const diggs = [...html.matchAll(diggRegex)].map((m) => Number(m[1]));
    const comments = [...html.matchAll(commentRegex)].map((m) => Number(m[1]));
    const dates = [...html.matchAll(dateRegex)].map((m) => m[1].trim());

    for (let i = 0; i < titles.length; i++) {
      const dateStr = dates[i] || "";
      const date = dateStr.slice(0, 10);
      allArticles.push({
        platform: "cnblogs", title: titles[i][2], url: titles[i][1].startsWith("http") ? titles[i][1] : `${baseUrl}${titles[i][1]}`,
        date, views: views[i] || 0, likes: diggs[i] || 0, comments: comments[i] || 0,
      });
    }

    if (!html.includes(">下一页<") && !html.includes(">Next<")) break;
  }

  return {
    articleCount: allArticles.length,
    totalViews: allArticles.reduce((s, a) => s + a.views, 0),
    totalLikes: allArticles.reduce((s, a) => s + a.likes, 0),
    totalComments: allArticles.reduce((s, a) => s + a.comments, 0),
    articles: allArticles,
  };
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") || "*";

    // OPTIONS 预检不检查环境变量，否则浏览器 CORS 失败
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    // 检查必填环境变量
    const missing = [];
    if (!env.CF_API_TOKEN) missing.push("CF_API_TOKEN");
    if (!env.CF_ZONE_ID) missing.push("CF_ZONE_ID");
    if (missing.length > 0) {
      return respond(null, `Worker 配置不完整：${missing.join(", ")}`, 0, origin);
    }

    if (request.method === "GET" && url.pathname === "/ping") {
      return respond({ status: "ok", message: "Worker is alive" }, "ok", 1, origin);
    }

    // GET /platform — 多平台统计
    if (request.method === "GET" && url.pathname === "/platform") {
      try {
        const cacheKey = new Request(`${url.origin}/platform-cache-v4`, { method: "GET" });
        const cached = await caches.default.match(cacheKey);
        if (cached) {
          const data = await cached.json();
          data._cache = "hit";
          return new Response(JSON.stringify(data), {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders(origin),
            },
          });
        }

        const [csdn, juejin, cnblogs] = await Promise.allSettled([
          fetchCSDN(env), fetchJuejin(env), fetchCnblogs(env),
        ]);

        const csdnData = csdn.status === "fulfilled" ? csdn.value : null;
        const juejinData = juejin.status === "fulfilled" ? juejin.value : null;
        const cnblogsData = cnblogs.status === "fulfilled" ? cnblogs.value : null;

        const allArticles = {};
        const platData = { csdn: csdnData, juejin: juejinData, cnblogs: cnblogsData };
        for (const plat of ["csdn", "juejin", "cnblogs"]) {
          const data = platData[plat];
          if (!data) continue;
          for (const a of data.articles || []) {
            const key = a.title.trim();
            if (!allArticles[key]) allArticles[key] = { date: "" };
            allArticles[key][plat] = { views: a.views, likes: a.likes, url: a.url };
            if (!allArticles[key].date) allArticles[key].date = a.date || "";
          }
        }

        const mergedArticles = Object.entries(allArticles)
          .map(([title, val]) => ({ title, date: val.date, csdn: val.csdn || null, juejin: val.juejin || null, cnblogs: val.cnblogs || null }))
          .sort((a, b) => {
            if (!a.date && !b.date) return 0;
            if (!a.date) return 1;
            if (!b.date) return -1;
            return a.date.localeCompare(b.date);
          });

        const result = {
          csdn: csdnData ? { totalViews: csdnData.totalViews, totalLikes: csdnData.totalLikes, articleCount: csdnData.articleCount, totalComments: csdnData.totalComments, totalCollects: csdnData.totalCollects } : null,
          juejin: juejinData ? { totalViews: juejinData.totalViews, totalLikes: juejinData.totalLikes, articleCount: juejinData.articleCount, totalCollects: juejinData.totalCollects, followers: juejinData.followers } : null,
          cnblogs: cnblogsData ? { totalViews: cnblogsData.totalViews, totalLikes: cnblogsData.totalLikes, articleCount: cnblogsData.articleCount, totalComments: cnblogsData.totalComments } : null,
          mergedArticles,
          generatedAt: new Date().toISOString(),
        };

        const response = respond(result, "ok", 1, origin);
        const cacheResponse = new Response(response.clone().body, {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "public, max-age=3600",
            ...corsHeaders(origin),
          },
        });
        ctx.waitUntil(caches.default.put(cacheKey, cacheResponse));
        return response;
      } catch (e) {
        return respond(null, e.message, 0, origin);
      }
    }

    // POST — 获取完整分析数据
    if (request.method === "POST") {
      try {
        const body = await request.json();
        const days = Math.min(body?.days || 7, 364);

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
            status: 200,
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders(origin),
            },
          });
        }

        const dhJson = await callCF(buildDailyHourlyQuery(env.CF_ZONE_ID, days), env);
        const { daily, hourly, totals } = parseDailyHourly(dhJson);

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

        const response = respond(result, "ok", 1, origin);

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
        return respond(null, e.message, 0, origin);
      }
    }

    return respond(null, "Not Found", 0, origin);
  },
};
