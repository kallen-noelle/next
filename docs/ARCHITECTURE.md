# 项目架构说明

> 详细说明栏轩阁博客系统的目录结构、组件规范和路由约定。

## 目录结构

```
app/
├── (main)/                  # 主路由组（共享布局）
│   ├── about/               # 关于页面
│   ├── analytics/           # 流量分析
│   ├── article/[id]/        # 文章详情
│   ├── auth/                # 登录认证
│   ├── chatter/             # 闲聊区
│   ├── friends/             # 友链
│   ├── gallery/             # 图库
│   ├── literature/          # 文学
│   ├── project/             # 项目展示
│   ├── timeline/            # 时间线
│   ├── tools/               # 工具页（游戏/转换器等）
│   │   ├── 2048/
│   │   ├── base-convert/
│   │   ├── gomoku/
│   │   ├── image/
│   │   ├── image-puzzle/
│   │   ├── json-formatter/
│   │   ├── minesweeper/
│   │   ├── password/
│   │   ├── qrcode/
│   │   ├── snake/
│   │   ├── tetris/
│   │   └── wishes/
│   ├── layout.tsx           # 主布局
│   ├── page.tsx             # 首页
│   └── template.tsx         # 页面模板
├── admin/                   # 管理后台
├── _components/             # 共享组件
│   ├── admin/               # 管理后台组件
│   ├── article/             # 文章相关
│   ├── auth/                # 认证组件
│   ├── comment/             # 评论（Giscus）
│   ├── common/              # 通用组件
│   ├── effects/             # 特效（樱花/萤火虫/草地）
│   ├── layout/              # 布局组件
│   ├── literature/          # 文学组件
│   ├── project/             # 项目组件
│   └── timeline/            # 时间线组件
├── layout.tsx               # 根布局
└── sitemap.ts               # 站点地图
```

## 技术栈

| 类别       | 技术                       |
| ---------- | -------------------------- |
| 框架       | Next.js 16 + App Router    |
| 语言       | TypeScript                 |
| 样式       | Tailwind CSS               |
| 动画       | Framer Motion              |
| 图标       | Lucide React               |
| 评论系统   | Giscus (GitHub Discussions)|
| 字体       | Geist Sans / Geist Mono    |

## 组件规范

- 所有组件文件（`app/_components/` 和 `app/**/page.tsx`）统一使用 **`export default function`**
- `app/_components/` 下所有组件均为 **Client Component**（带有 `"use client"`）
- 页面文件（`page.tsx`）可以是 Server Component，按需添加 `"use client"`
- 样式优先使用 Tailwind 原子类，复杂样式才写自定义 CSS

## 路由结构

- `(main)` 为 Route Group，共享主布局（含顶栏、浮动导航等）
- `admin` 为独立路由组，独立布局
- 工具页位于 `(main)/tools/` 下，每个工具一个子目录

## 设计规范

详见 [docs/STYLE-GUIDE.md](./STYLE-GUIDE.md)：
- 玻璃拟态卡片风格
- 亮色/暗色双主题
- 统一的配色 Token 和文字层级
