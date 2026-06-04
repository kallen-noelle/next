import fs from "fs";
import path from "path";
import type { Metadata } from "next";
import LiteratureDetailClient from "./LiteratureDetailClient";

export const revalidate = 0;

type OpTag = { articles: { id: number; title: string; content?: string }[] };
type OpData = { rows: OpTag[] };

function findArticle(data: OpData, id: string) {
  for (const tag of data.rows || []) {
    const found = tag.articles?.find((a) => String(a.id) === id);
    if (found) return found;
  }
  return null;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
    const p = path.join(process.cwd(), "public", "data", "op-articles.json");
    const raw = fs.readFileSync(p, "utf-8");
    const data = JSON.parse(raw) as OpData;
    const item = findArticle(data, id);
    if (item) return { title: item.title, description: item.content?.slice(0, 200) || "" };
    return { title: "Literature" };
}

export function generateStaticParams() {
    const p = path.join(process.cwd(), "public", "data", "op-articles.json");
    const raw = fs.readFileSync(p, "utf-8");
    const data = JSON.parse(raw) as OpData;
    const ids: number[] = [];
    for (const tag of data.rows || []) {
      for (const a of tag.articles || []) {
        if (a.id != null) ids.push(a.id);
      }
    }
    return ids.map((id) => ({ id: String(id) }));
}

export default function LiteratureDetailPage(props: { params: Promise<{ id: string }> }) {
  return <LiteratureDetailClient params={props.params} />;
}
