// Worker 延迟基准测试脚本
// 用法: node workers/benchmark-worker.js

const WORKER_URL = "https://analytics.lxpavilion.top";
const RUNS = 10;
const DATE_TYPES = [
  { days: 7,  label: "7天" },
  { days: 14, label: "14天" },
  { days: 30, label: "30天" },
  { days: 364, label: "1年" },
];

async function timeRequest(label, fn) {
  const start = performance.now();
  let status, size, cache;
  try {
    const resp = await fn();
    status = resp.status;
    const text = await resp.text();
    size = (text.length / 1024).toFixed(1);
    const json = JSON.parse(text);
    cache = json._cache || "-";
  } catch (e) {
    return { label, status: "ERR", error: e.message, ms: null, cache: "-" };
  }
  const ms = (performance.now() - start).toFixed(1);
  return { label, status, ms, size, cache };
}

async function runBenchmark() {
  console.log(`\n=== Cloudflare Worker 耗时测试 ===`);
  console.log(`目标: ${WORKER_URL}`);
  console.log(`时间: ${new Date().toISOString()}`);
  console.log(`每种日期类型各测 ${RUNS} 次\n`);

  const allResults = [];

  // 预热
  console.log("--- 预热 ---");
  await timeRequest("warmup", () => fetch(`${WORKER_URL}/ping`));
  console.log("预热完成\n");

  // 测试每种日期类型
  for (const dt of DATE_TYPES) {
    console.log(`--- POST / (${dt.label}) ---`);
    for (let i = 0; i < RUNS; i++) {
      const r = await timeRequest(`${dt.label}#${i+1}`, () =>
        fetch(WORKER_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ days: dt.days }),
        })
      );
      console.log(`  ${r.label}: ${r.ms}ms (cache=${r.cache}, size=${r.size}KB)`);
      allResults.push(r);
      await new Promise(r => setTimeout(r, 300));
    }
    console.log();
  }

  // 按日期类型分组统计
  const groups = {};
  for (const r of allResults) {
    const key = r.label.replace(/#\d+$/, "");
    if (!groups[key]) groups[key] = [];
    if (r.ms !== null) groups[key].push(parseFloat(r.ms));
  }

  console.log("==========================================");
  console.log("           耗时统计汇总");
  console.log("==========================================");
  for (const [key, times] of Object.entries(groups)) {
    const sorted = [...times].sort((a, b) => a - b);
    const avg = (times.reduce((s, v) => s + v, 0) / times.length).toFixed(1);
    const min = sorted[0].toFixed(1);
    const max = sorted[sorted.length - 1].toFixed(1);
    const p50 = sorted[Math.floor(sorted.length * 0.5)].toFixed(1);
    const p95 = sorted[Math.floor(sorted.length * 0.95)].toFixed(1);
    console.log(`\n${key} (${times.length} 次):`);
    console.log(`  平均: ${avg}ms | 最小: ${min}ms | 最大: ${max}ms`);
    console.log(`  P50: ${p50}ms | P95: ${p95}ms`);
  }
  console.log("\n==========================================\n");
}

runBenchmark().catch(console.error);
