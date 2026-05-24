import fs from "fs";
import path from "path";
import ArticleDetailClient from "./ArticleDetailClient";

export function generateStaticParams() {
  const p = path.join(process.cwd(), "public", "data", "articles.json");
  if (!fs.existsSync(p)) return [];
  const data = JSON.parse(fs.readFileSync(p, "utf-8")) as { rows: { id: number }[] };
  return (data.rows || []).map((a) => ({ id: String(a.id) }));
}

export default function ArticleDetailPage(props: { params: Promise<{ id: string }> }) {
  return <ArticleDetailClient params={props.params} />;
}