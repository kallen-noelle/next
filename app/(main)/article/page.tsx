import type { Metadata } from "next";
import ArticleListClient from "./ArticleListClient";

export const metadata: Metadata = {
  title: "Articles",
  description: "技术文章与开发笔记，涵盖 Web 前端、全栈开发与编程实践。",
};

export default function ArticlePage() {
  return <ArticleListClient />;
}
