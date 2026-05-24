import fs from "fs";
import path from "path";
import ProjectDetailClient from "./ProjectDetailClient";

export function generateStaticParams() {
  const p = path.join(process.cwd(), "public", "data", "projects.json");
  if (!fs.existsSync(p)) return [];
  const data = JSON.parse(fs.readFileSync(p, "utf-8")) as { rows: { id: number }[] };
  return (data.rows || []).map((a) => ({ id: String(a.id) }));
}

export default function ProjectDetailPage(props: { params: Promise<{ id: string }> }) {
  return <ProjectDetailClient params={props.params} />;
}
