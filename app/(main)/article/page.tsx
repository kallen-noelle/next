import type { Metadata } from "next";
import ArticleListClient from "./ArticleListClient";

export const metadata: Metadata = {
  title: "技术文章与开发笔记",
  description: "技术文章与开发笔记，涵盖 Web 前端、全栈开发与编程实践。",
  openGraph: {
    title: "技术文章与开发笔记 | Dream Blog - 个人技术博客与作品集",
    description: "技术文章与开发笔记，涵盖 Web 前端、全栈开发与编程实践。",
    images: [{ url: "/bg/2.jpg", width: 1200, height: 630 }],
  },
};

export default function ArticlePage() {
  return <ArticleListClient />;
}
