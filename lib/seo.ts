import type { Metadata } from "next";
import { siteConfig } from "./siteConfig";

// ── Helper ──────────────────────────────────────────
function ogImg(url: string) {
  return [{ url, width: 1200, height: 630 } as const];
}

// ── Shared constants ────────────────────────────────
/** 站点默认 OG 图片 — 首页及未单独配置的页面使用 */
export const defaultOgImage = "/seo/logo.png";

/** 站点关键词 */
export const SITE_KEYWORDS = [
  "栏轩阁", "个人博客", "技术博客", "前端开发", "全栈开发",
  "Web开发", "JavaScript", "TypeScript", "React", "Next.js",
  "编程", "项目实践", "学习笔记",
];

/** OG 基础字段 — layout 和 meta() 共用 */
const OG_BASE = {
  siteName: siteConfig.title,
  type: "website" as const,
  locale: "zh_CN",
};

/** OG title suffix appended to page titles */
export const OG_TITLE_SUFFIX = `| ${siteConfig.title}`;

/** 站点 URL — sitemap / feed / layout 共用 */
export const SITE_URL = `https://${siteConfig.blog.replace(/^https?:\/\//, "")}`;


// ── Helper to build Metadata ────────────────────────
function meta(title: string, description: string, image: string): Metadata {
  return {
    title,
    description,
    openGraph: {
      ...OG_BASE,
      title: `${title} ${OG_TITLE_SUFFIX}`,
      description,
      images: ogImg(image),
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} ${OG_TITLE_SUFFIX}`,
      description,
      images: [image],
    },
  };
}

// ══════════════════════════════════════════════════════
// JSON-LD 结构化数据
// ══════════════════════════════════════════════════════

/** WebSite schema — 首页使用 */
export function websiteSchema(url?: string) {
  const siteUrl = url || (() => {
    const raw = siteConfig.blog.replace(/^https?:\/\//, "");
    return `https://${raw}`;
  })();

  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.title,
    alternateName: siteConfig.navTitle,
    description: siteConfig.seoDescription,
    url: siteUrl,
  };
}

/** JSON-LD schema — 详情页使用 */
export function jsonLdSchema(
  type: "Article" | "CreativeWork",
  title: string,
  description?: string,
  date?: string,
  image?: string,
) {
  return {
    "@context": "https://schema.org",
    "@type": type,
    name: title,
    headline: title,
    description: description || undefined,
    datePublished: date || undefined,
    dateCreated: date || undefined,
    author: { "@type": "Person", name: siteConfig.authorName },
    image: image || undefined,
  };
}

/** Person schema — 关于页使用 */
export function personSchema(url?: string) {
  const sameAs = [
    siteConfig.github && `https://${siteConfig.github}`,
    siteConfig.gitee && `https://${siteConfig.gitee}`,
    siteConfig.juejin && `https://${siteConfig.juejin}`,
    siteConfig.csdn && `https://${siteConfig.csdn}`,
    siteConfig.cnblogs && `https://${siteConfig.cnblogs}`,
  ].filter(Boolean);

  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: siteConfig.authorName,
    description: siteConfig.seoDescription,
    url: url || `https://${siteConfig.blog.replace(/^https?:\/\//, "")}`,
    image: siteConfig.avatarUrl,
    sameAs: sameAs.length > 0 ? sameAs : undefined,
  };
}

/** BreadcrumbList JSON-LD */
export function breadcrumbSchema(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  };
}

// ══════════════════════════════════════════════════════
// 页面 SEO 配置 — 统一在此处修改，全局生效
// ══════════════════════════════════════════════════════

const SEO_IMAGE = "/seo/logo.png";

/** 文章列表页 */
export const articleMetadata: Metadata = meta(
  "技术文章与开发笔记",
  "技术文章与开发笔记，涵盖 Web 前端、全栈开发与编程实践。深入解析 JavaScript、TypeScript、React、Next.js 等主流技术，分享实际项目中的经验与解决方案。",
  SEO_IMAGE,
);

/** 项目列表页 */
export const projectMetadata: Metadata = meta(
  "项目实践与开源探索",
  "开源项目与实验记录，涵盖全栈开发、前端框架、工具库和有趣的技术尝试。展示从构思到落地的完整项目实践过程与代码成果。",
  SEO_IMAGE,
);

/** 学习历程页 */
export const timelineMetadata: Metadata = meta(
  "学习历程与技术成长",
  "学习历程与技术成长路径，记录从基础到进阶的编程学习笔记、技能清单与里程碑事件。展示持续学习与技术积累的完整轨迹。",
  SEO_IMAGE,
);

/** 文学创作页 */
export const literatureMetadata: Metadata = meta(
  "文学创作与随笔",
  "诗歌、散文、随笔与文学创作，用文字记录思考、情感与生活感悟。在代码之外，用人文视角观察世界，分享阅读与写作的心得。",
  SEO_IMAGE,
);

/** 摄影图库页 */
export const galleryMetadata: Metadata = meta(
  "摄影图库与相册",
  "摄影作品集与相册收藏，用镜头捕捉旅途风景、日常生活与美好瞬间。分享视觉故事与摄影创作。",
  SEO_IMAGE,
);

/** 友情链接页 */
export const friendsMetadata: Metadata = meta(
  "友情链接",
  "友情链接与博客矩阵，收录技术社区中的优质博客和有趣灵魂。互相学习、交流分享，共同构建开放的技术网络。",
  SEO_IMAGE,
);

/** 关于页 */
export const aboutMetadata: Metadata = meta(
  "关于博主",
  "关于栏轩阁博主 - 个人简介、技术栈、联系方式与社交媒体。了解博客背后的创作者，欢迎交流与合作。",
  SEO_IMAGE,
);

/** 说说页 */
export const chatterMetadata: Metadata = meta(
  "说说与杂谈",
  "日常碎片、思考记录与灵感分享 - 技术随笔、生活感悟与即兴创作。记录编程之外的思考，捕捉灵感闪现的瞬间。",
  SEO_IMAGE,
);

/** 统计页 */
export const analyticsMetadata: Metadata = meta(
  "网站统计",
  "站点流量、访客画像与多平台数据分析 — 实时监控博客访问趋势与性能指标。",
  SEO_IMAGE,
);

/** 成长记录页 */
export const growthMetadata: Metadata = meta(
  "博客成长记录",
  "从第一行代码开始的每一次提交，记录栏轩阁博客的技术演进历程。",
  SEO_IMAGE,
);
