/**
 * Cloudflare GraphQL 查询构建器。
 */

/** 构建「每日 + 最近 3 天逐小时」查询。 */
export function buildDailyHourlyQuery(
  zoneId: string,
  days: number
): string {
  const endDate = new Date();
  const startDate = new Date(Date.now() - days * 86_400_000);
  const startStr = startDate.toISOString().slice(0, 10);
  const endStr = endDate.toISOString().slice(0, 10);
  const hStart = new Date(Math.max(startDate.getTime(), Date.now() - 3 * 86_400_000));
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

/** 构建指定日期的各维度细分查询。 */
export function buildBreakdownQuery(
  zoneId: string,
  dateStr: string
): string {
  const startMs = new Date(dateStr).getTime();
  const endMs = startMs + 86_400_000;
  const startISO = new Date(startMs).toISOString();
  const endISO = new Date(endMs).toISOString();

  return `{
    viewer {
      zones(filter: {zoneTag: "${zoneId}"}) {
        byCountry: httpRequestsAdaptiveGroups(limit: 100, filter: {datetime_geq: "${startISO}", datetime_lt: "${endISO}"}, orderBy: [count_DESC]) {
          count dimensions { clientCountryName }
        }
        byDevice: httpRequestsAdaptiveGroups(limit: 10, filter: {datetime_geq: "${startISO}", datetime_lt: "${endISO}"}, orderBy: [count_DESC]) {
          count dimensions { clientDeviceType }
        }
        byBrowser: httpRequestsAdaptiveGroups(limit: 10, filter: {datetime_geq: "${startISO}", datetime_lt: "${endISO}"}, orderBy: [count_DESC]) {
          count dimensions { userAgentBrowser }
        }
        byOS: httpRequestsAdaptiveGroups(limit: 10, filter: {datetime_geq: "${startISO}", datetime_lt: "${endISO}"}, orderBy: [count_DESC]) {
          count dimensions { userAgentOS }
        }
        byCache: httpRequestsAdaptiveGroups(limit: 10, filter: {datetime_geq: "${startISO}", datetime_lt: "${endISO}"}, orderBy: [count_DESC]) {
          count dimensions { cacheStatus }
        }
        byHTTP: httpRequestsAdaptiveGroups(limit: 10, filter: {datetime_geq: "${startISO}", datetime_lt: "${endISO}"}, orderBy: [count_DESC]) {
          count dimensions { clientRequestHTTPProtocol }
        }
      }
    }
  }`;
}
