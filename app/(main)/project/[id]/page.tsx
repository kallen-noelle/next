import fs from "fs";
import path from "path";
import type { Metadata } from "next";
import ProjectDetailClient from "./ProjectDetailClient";
import { OG_TITLE_SUFFIX } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  try {
    const p = path.join(process.cwd(), "public", "data", "projects", `${id}.json`);
    const raw = fs.readFileSync(p, "utf-8");
    const data = JSON.parse(raw) as { name: string; summary?: string; coverImage?: string };
    const images = data.coverImage
      ? [{ url: data.coverImage, width: 1200, height: 630 }]
      : undefined;
    return {
      title: data.name,
      description: data.summary || "",
      openGraph: {
        title: `${data.name} ${OG_TITLE_SUFFIX}`,
        description: data.summary || "",
        images,
      },
    };
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
