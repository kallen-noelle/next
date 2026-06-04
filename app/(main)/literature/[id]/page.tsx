import fs from "fs";
import path from "path";
import type { Metadata } from "next";
import LiteratureDetailClient from "./LiteratureDetailClient";

export const revalidate = 0;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  try {
    const p = path.join(process.cwd(), "public", "data", "op-articles.json");
    const raw = fs.readFileSync(p, "utf-8");
    const data = JSON.parse(raw) as { rows: { id?: number; title: string; content?: string }[] };
    const item = data.rows?.find((a) => String(a.id) === id);
    if (item) return { title: item.title, description: item.content?.slice(0, 200) || "" };
  } catch { /* skip */ }
  return { title: "Literature" };
}

export function generateStaticParams() {
  return [];
}

export default function LiteratureDetailPage(props: { params: Promise<{ id: string }> }) {
  return <LiteratureDetailClient params={props.params} />;
}
