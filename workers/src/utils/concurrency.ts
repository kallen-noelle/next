/**
 * 带并发控制的串行映射 —— 按 `concurrency` 分组依次执行。
 * 单个 item 的 reject 会被吞掉（返回 null）。
 */
export async function pMapSerial<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<(R | null)[]> {
  const results: (R | null)[] = [];
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items
      .slice(i, i + concurrency)
      .map((item, idx) => fn(item, i + idx).catch(() => null));
    const batchResults = await Promise.all(batch);
    results.push(...batchResults);
  }
  return results;
}
