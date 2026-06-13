import type { Metadata } from "next";
import { siteConfig } from "./siteConfig";

// ── Helper ──────────────────────────────────────────
function ogImg(url: string) {
  return [{ url, width: 1200, height: 630 } as const];
}

// ── Shared constants ────────────────────────────────
/** 站点默认 OG 图片 — 首页及未单独配置的页面使用，跟随头像配置 */
export const defaultOgImage = siteConfig.avatarUrl;

/** OG title suffix appended to page titles */
export const OG_TITLE_SUFFIX = `| ${siteConfig.title}`;


// ── Helper to build Metadata ────────────────────────
function meta(title: string, description: string, image: string): Metadata {
  return {
    title,
    description,
    openGraph: {
      title: `${title} ${OG_TITLE_SUFFIX}`,
      description,
      images: ogImg(image),
    },
  };
}

// ══════════════════════════════════════════════════════
// 页面 SEO 配置 — 统一在此处修改，全局生效
// ══════════════════════════════════════════════════════

/** 文章列表页 */
export const articleMetadata: Metadata = meta(
  "技术文章与开发笔记",
  "技术文章与开发笔记，涵盖 Web 前端、全栈开发与编程实践。深入解析 JavaScript、TypeScript、React、Next.js 等主流技术，分享实际项目中的经验与解决方案。",
  "/bg/2.jpg",
);

/** 项目列表页 */
export const projectMetadata: Metadata = meta(
  "项目实践与开源探索",
  "开源项目与实验记录，涵盖全栈开发、前端框架、工具库和有趣的技术尝试。展示从构思到落地的完整项目实践过程与代码成果。",
  "/bg/3.jpg",
);

/** 学习历程页 */
export const timelineMetadata: Metadata = meta(
  "学习历程与技术成长",
  "学习历程与技术成长路径，记录从基础到进阶的编程学习笔记、技能清单与里程碑事件。展示持续学习与技术积累的完整轨迹。",
  "/bg/4.jpg",
);

/** 文学创作页 */
export const literatureMetadata: Metadata = meta(
  "文学创作与随笔",
  "诗歌、散文、随笔与文学创作，用文字记录思考、情感与生活感悟。在代码之外，用人文视角观察世界，分享阅读与写作的心得。",
  "/bg/9.jpg",
);

/** 摄影图库页 */
export const galleryMetadata: Metadata = meta(
  "摄影图库与相册",
  "摄影作品集与相册收藏，用镜头捕捉旅途风景、日常生活与美好瞬间。分享视觉故事与摄影创作。",
  "/bg/5.PNG",
);

/** 友情链接页 */
export const friendsMetadata: Metadata = meta(
  "友情链接",
  "友情链接与博客矩阵，收录技术社区中的优质博客和有趣灵魂。互相学习、交流分享，共同构建开放的技术网络。",
  "/bg/7.JPG",
);

/** 关于页 */
export const aboutMetadata: Metadata = meta(
  "关于博主",
  "关于栏轩阁博主 - 个人简介、技术栈、联系方式与社交媒体。了解博客背后的创作者，欢迎交流与合作。",
  "/bg/8.JPG",
);

/** 说说页 */
export const chatterMetadata: Metadata = meta(
  "说说与杂谈",
  "日常碎片、思考记录与灵感分享 - 技术随笔、生活感悟与即兴创作。记录编程之外的思考，捕捉灵感闪现的瞬间。",
  "/bg/5.PNG",
);