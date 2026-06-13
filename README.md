# 栏轩阁 — 个人技术博客

基于 **Next.js 16** 的个人技术博客，支持静态导出（GitHub Pages）和 Docker 运行。涵盖文章、项目、图库、说说、友链等内容管理，配备 Live2D 看板娘、粒子特效、音乐播放器等交互体验。

**在线地址：** [https://www.lxpavilion.top](https://www.lxpavilion.top)

---

## Fork & 部署自己的站点

修改以下文件中的配置项即可移植到自己的环境：

| 文件 | 改动内容 |
|------|---------|
| [lib/siteConfig.ts](lib/siteConfig.ts) | 域名、仓库名、作者信息、后端地址、社交链接、Giscus 配置 |
| [workers/wrangler.json](workers/wrangler.json) | Worker 路由域名、Zone ID、平台账号 ID |

其他文件均通过 `siteConfig` 引用，改这两个文件即可联动更新。

**Giscus 评论：** 新仓库需在 Settings 中开启 Discussions，然后到 [giscus.app](https://giscus.app) 获取 `categoryId`，填入 `siteConfig.ts` 的 `giscusCategoryId`。

---

## 功能特性

- **内容管理：** 文章（Markdown / 分类 / 标签 / TOC）、项目、图库（瀑布流 / Lightbox）、说说、友链、时间线
- **交互体验：** Live2D 看板娘、动态背景轮播、粒子特效（萤火虫/樱花）、弹幕、Click 涟漪、音乐播放器、暗黑模式、设置面板
- **管理后台 /admin：** 完整 CRUD、Markdown 编辑器、GitHub 数据同步、孤立媒体清理、SEO 管理
- **工程化：** 静态导出、Docker 部署、CI/CD、Giscus 评论、Sitemap / RSS / JSON-LD

---

## 技术栈

| 前端 | 后端 |
|------|------|
| Next.js 16 + Turbopack | Spring Boot 3 |
| React 19 + TypeScript | MySQL + MyBatis Plus |
| Tailwind CSS 4 | Redis + MinIO |
| Framer Motion | Spring Security + JWT |
| Zustand | WebFlux (SSE) |
| Giscus | |

后端仓库：[pc-Blog/springBoot](https://github.com/pc-Blog/springBoot)

---

## 本地运行

```bash
npm install
npm run dev        # http://localhost:3000
```

需要后端 API 配合，修改 `siteConfig.ts` 中的 `backUrl` 指向后端地址。

---

## Docker 部署

```bash
docker build -t blog-next .
docker run -d -p 3000:3000 --name blog-next blog-next
```

容器使用 Standalone 模式，后端地址通过 `siteConfig.ts` 的 `backUrl` 配置。

---

## GitHub Pages 静态部署

```bash
npm run build:static    # 产物在 out/
```

推送 `master` 或 `data` 分支自动触发 GitHub Actions：构建 → 导出 → 部署到 `gh-pages` 分支。

### 数据同步流程

在 `/admin` 后台使用 GitHub Token（`repo` 权限）触发同步：

```
后端 API → 同步脚本 → data 分支（JSON + 媒体）→ CI 触发 → 静态构建 → gh-pages
```

---

## LICENSE

MIT
