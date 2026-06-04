import fs from "fs";
import path from "path";
import type { Metadata } from "next";
import ArticleDetailClient from "./ArticleDetailClient";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  try {
    const p = path.join(process.cwd(), "public", "data", "articles", `${id}.json`);
    const raw = fs.readFileSync(p, "utf-8");
    const data = JSON.parse(raw) as { title: string; summary?: string };
    return { title: data.title, description: data.summary || "" };
  } catch { return { title: "Article" }; }
}

export function generateStaticParams() {
  const p = path.join(process.cwd(), "public", "data", "articles.json");
  if (!fs.existsSync(p)) return [];
  const data = JSON.parse(fs.readFileSync(p, "utf-8")) as { rows: { id: number }[] };
  return (data.rows || []).map((a) => ({ id: String(a.id) }));
}

export default function ArticleDetailPage(props: { params: Promise<{ id: string }> }) {
  return <ArticleDetailClient params={props.params} />;
}