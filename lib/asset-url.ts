/**
 * Resolve a public asset path.
 * 站点部署在根路径，直接返回原路径。
 */
export function assetUrl(path: string): string {
  return path;
}
