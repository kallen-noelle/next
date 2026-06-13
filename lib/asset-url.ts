import { siteConfig } from "./siteConfig";

/**
 * Resolve a public asset path.
 * 有自定义域名时直接返回，否则加上 GitHub Pages 的仓库名前缀。
 */
export function assetUrl(path: string): string {
  if (siteConfig.hasDomain) return path;
  const repo = siteConfig.repo.split("/")[1];
  return `/${repo}${path}`;
}
