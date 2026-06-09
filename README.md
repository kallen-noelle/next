# 📘 栏轩阁 — 个人技术博客

一个基于 **Next.js 16** 的个人技术博客系统，以静态导出部署于 GitHub Pages，后端由 Spring Boot 3 提供 API 支持。涵盖文章、项目、图库、说说、友链等完整内容管理，配备 Live2D 看板娘、粒子特效、音乐播放器等丰富交互体验。

**🌐 在线地址：** [https://www.lxpavilion.top](https://www.lxpavilion.top)

---

## ✨ 功能特性

### 📝 内容管理

| 模块 | 功能 |
|------|------|
| **文章** | Markdown 编辑，支持分类/标签/封面图，自动生成目录（TOC），文章导航（上一篇/下一篇），浏览量统计 |
| **项目** | 展示开源项目，关联 GitHub 仓库和 Demo 链接，技术栈标签 |
| **图库** | 相册管理，照片瀑布流展示，点击展开大图预览，Lightbox 浏览 |
| **说说（Chatter）** | 碎片化记录，心情标签（带 Emoji），图片上传，评论区，按天分组/展开详情 |
| **文学（Literature）** | 精选文章/随笔合集展示 |
| **友链（Friends）** | 友情链接申请与展示，支持复制申请格式 |
| **时间线（Timeline）** | 技能与成长历程的可视化展示 |

### 🎨 交互体验

- **Live2D 看板娘** — 支持 Diana / Ava 两个模型，点击不同部位触发不同语音回复，鼠标悬浮页面元素显示提示气泡，闲置时会随机自言自语
- **动态背景** — 6 张背景图自动轮播（10 秒间隔），支持手动切换，深色白色遮罩，背景模糊度 0-20px 可调
- **粒子特效** — 深色模式显示萤火虫（最多 500 只），浅色模式显示樱花飘落（最多 400 片），浓度可调（0-1000），草底动效
- **Danmaku 弹幕** — 页面顶部浮动文字效果
- **Click 涟漪** — 页面任意位置点击产生水波扩散特效
- **音乐播放器** — 页面右下角悬浮，支持网易云歌单接入，可切换/暂停
- **暗黑模式** — 一键切换，状态持久化到 localStorage，渐变过渡
- **全屏模式** — 一键全屏浏览
- **设置面板** — 下拉式设置面板（Kirameku 风格），可调背景/模糊度/粒子浓度

### ⚙️ 管理后台（`/admin`）

- 文章/项目/说说/图库/友链/分类/标签/媒体/关于 完整 CRUD
- Markdown 编辑器，支持拖拽/粘贴上传图片
- GitHub 数据同步（推送 JSON + 媒体 + 音乐到 data 分支）
- 孤立媒体文件扫描与清理
- SEO 元数据管理

### 🔧 工程化

- **静态导出** — `npm run build:static` 导出全站静态 HTML，部署到 GitHub Pages
- **Standalone 部署** — Docker 容器运行，适合 VPS/服务器
- **CI/CD** — GitHub Actions 自动构建、部署到 gh-pages
- **评论系统** — 接入 Giscus（基于 GitHub Discussions）
- **Sitemap / RSS** — 自动生成 sitemap.xml 和 feed.xml（兼容 SEO）
- **JSON-LD** — 结构化数据标记

---

## 🏗️ 技术栈

### 前端

| 技术 | 用途 |
|------|------|
| **Next.js 16** + Turbopack | React 框架，App Router，服务端组件 |
| **React 19** | UI 框架 |
| **TypeScript** | 类型安全 |
| **Tailwind CSS 4** | 样式，`@custom-variant dark` 暗黑模式 |
| **Framer Motion** | 页面过渡动画、展开/收起、弹窗 |
| **Zustand** | 状态管理（auth / ui / music / settings） |
| **Lucide React** | 图标库 |
| **JSZip** | 文章/项目 Markdown + 图片打包下载 |
| **Giscus** | 基于 GitHub Discussions 的评论 |

### 后端

| 技术 | 用途 |
|------|------|
| **Spring Boot 3** | Java 后端框架 |
| **MySQL** | 关系数据库 |
| **MyBatis Plus** | ORM 框架 |
| **Redis** | 缓存 |
| **MinIO** | 对象存储（图片/文件） |
| **Spring Security** | 认证与授权 |
| **JWT** | 无状态登录 |
| **WebFlux** | SSE 流式通信 |

**后端仓库：** [https://github.com/pc-Blog/springBoot](https://github.com/pc-Blog/springBoot)

---

## 🚀 前端本地运行

```bash
# 安装依赖
npm install

# 启动开发服务器（默认 http://localhost:3000）
npm run dev
```

> 本地开发需要后端 API 配合。后端启动方式见[后端仓库](https://github.com/pc-Blog/springBoot)。

---

## 🐳 前端 Docker 运行

```bash
# 构建镜像
docker build -t blog-next .

# 运行容器
docker run -d -p 3000:3000 \
  -e NEXT_PUBLIC_API_BASE=http://your-api:18016/api \
  --name blog-next blog-next
```

Docker 使用 Next.js **Standalone** 模式，需要设置 `NEXT_PUBLIC_API_BASE` 环境变量指向后端地址。

---

## 🌐 GitHub Pages 静态部署

### 构建

```bash
npm run build:static
```

产物输出到 `out/` 目录，可直接部署到任意静态托管服务。

### CI/CD

推送 `master` 或 `data` 分支到 GitHub 时自动触发：

```
master / data 推送
       ↓
  GitHub Actions
       ↓
  编译 + 类型检查 + 静态导出
       ↓
  部署到 gh-pages 分支
       ↓
  自定义域名 https://www.lxpavilion.top
```

### 手动数据同步

在 `/admin` 后台，需要 GitHub Personal Access Token（`repo` 权限）：

1. **Sync JSON Data** — 从后端 API 拉取文章/项目/说说等数据，推送到 `data` 分支
2. **Sync Media** — 同步图片/资源文件，增量下载（首次全量，后续只传变动）
3. **Sync Music** — 同步音乐文件

> 每次 `data` 分支推送会触发新的 CI 构建与部署。

### 数据架构

```
后端 API (Spring Boot)
       ↓ 管理员点击同步
  同步脚本 (github-sync.ts)
       ↓
  data 分支（JSON + 媒体文件）
       ↓ CI 触发
  静态构建 (Next.js build)
       ↓
  gh-pages 分支（产出物）
```

---

## 📁 项目结构

```
├── app/                        # Next.js App Router
│   ├── (main)/                 # 前台页面
│   │   ├── page.tsx            # Home 首页
│   │   ├── article/            # 文章列表 + 详情
│   │   ├── project/            # 项目列表 + 详情
│   │   ├── gallery/            # 相册
│   │   ├── chatter/            # 说说
│   │   ├── literature/         # 文学
│   │   ├── timeline/           # 时间线
│   │   ├── friends/            # 友链
│   │   ├── about/              # 关于
│   │   └── layout.tsx          # (main) 布局
│   ├── admin/                  # 管理后台
│   ├── _components/            # 共享组件
│   │   ├── layout/             # Header / Footer / 背景 / 弹幕
│   │   ├── common/             # 通用 UI（Dialog / Tooltip / 设置面板）
│   │   ├── article/            # 文章相关（Card / List / Sidebar）
│   │   ├── effects/            # 粒子特效（Fireflies / Sakura / WindyGrass）
│   │   └── comment/            # Giscus 评论
│   └── layout.tsx              # 根布局
├── lib/                        # 工具与配置
│   ├── api/                    # 后端 API 封装
│   ├── siteConfig.ts           # 站点配置（标题/背景/社交等）
│   ├── github-sync.ts          # GitHub data 分支同步
│   ├── download-content.ts     # 文章/项目 ZIP 下载
│   ├── static-data.ts          # 静态数据模式检测
│   └── asset-url.ts            # 资源路径处理
├── stores/                     # Zustand 状态管理
│   ├── authStore.ts            # 登录态
│   ├── musicStore.ts           # 音乐播放器
│   ├── uiStore.ts              # UI 状态
│   └── settingsStore.ts        # 背景/模糊/粒子设置
├── public/                     # 静态资源
│   ├── pio/                    # Live2D 看板娘资源
│   ├── live2d-models/          # Live2D 模型文件
│   ├── bg/                     # 背景图片
│   └── data/                   # 同步的数据 JSON
└── .github/workflows/          # CI/CD 工作流
    └── deploy.yml              # 构建 + 部署流水线
```

---

## 🔧 环境变量

| 变量 | 说明 | 必填 |
|------|------|------|
| `NEXT_PUBLIC_API_BASE` | 后端 API 地址 | 开发/容器部署必填 |
| `STATIC_EXPORT` | 设为 `true` 启用静态导出模式 | CI 构建时设置 |
| `NEXT_PUBLIC_IS_STATIC` | 设为 `true` 隐藏管理入口 | CI 构建时设置 |

---

## 📄 LICENSE

MIT
