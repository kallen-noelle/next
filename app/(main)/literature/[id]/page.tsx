import fs from "fs";
import path from "path";
import type { Metadata } from "next";
import LiteratureDetailClient from "./LiteratureDetailClient";

export function generateStaticParams() {
  const p = path.join(process.cwd(), "public", "data", "op-articles.json");
  if (!fs.existsSync(p)) return [];
  const raw = fs.readFileSync(p, "utf-8");
  const data = JSON.parse(raw) as { rows: { articles: { id: number }[] }[] };
  const ids: number[] = [];
  for (const tag of data.rows || []) {
    for (const a of tag.articles || []) {
      if (a.id != null) ids.push(a.id);
    }
  }
  return ids.map((id) => ({ id: String(id) }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  try {
    const p = path.join(process.cwd(), "public", "data", "op-articles.json");
    const raw = fs.readFileSync(p, "utf-8");
    const data = JSON.parse(raw) as { rows: { articles: { id: number; title: string; content?: string }[] }[] };
    for (const tag of data.rows || []) {
      const found = tag.articles?.find((a) => String(a.id) === id);
      if (found) return { title: found.title, description: found.content?.slice(0, 200) || "" };
    }
  } catch { /* skip */ }
  return { title: "Literature" };
}

export default function LiteratureDetailPage(props: { params: Promise<{ id: string }> }) {
  return <LiteratureDetailClient params={props.params} />;
}
