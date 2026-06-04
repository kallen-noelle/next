import fs from "fs";
import path from "path";
import type { Metadata } from "next";
import ProjectDetailClient from "./ProjectDetailClient";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  try {
    const p = path.join(process.cwd(), "public", "data", "projects", `${id}.json`);
    const raw = fs.readFileSync(p, "utf-8");
    const data = JSON.parse(raw) as { name: string; summary?: string };
    return { title: data.name, description: data.summary || "" };
  } catch { return { title: "Project" }; }
}

export function generateStaticParams() {
  const p = path.join(process.cwd(), "public", "data", "projects.json");
  if (!fs.existsSync(p)) return [];
  const data = JSON.parse(fs.readFileSync(p, "utf-8")) as { rows: { id: number }[] };
  return (data.rows || []).map((a) => ({ id: String(a.id) }));
}

export default function ProjectDetailPage(props: { params: Promise<{ id: string }> }) {
  return <ProjectDetailClient params={props.params} />;
}
