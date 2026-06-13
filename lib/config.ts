import { siteConfig as defaults } from "./siteConfig";

let merged = { ...defaults };

/**
 * 使用 about 表的字段覆盖 siteConfig 的默认值。
 * 相同 key 名自动覆盖，只需处理 key 名不一致的映射。
 */
export function loadConfig(about: Record<string, string>) {
  // 自动覆盖约表中与 siteConfig 同名的字段
  for (const key of Object.keys(about)) {
    if (key in merged && about[key]) {
      (merged as any)[key] = about[key];
    }
  }
  // key 名不一致的手动映射
  if (about.name) merged.authorName = about.name;
  if (about.summery) merged.bio = about.summery;
}

export { merged as siteConfig };
