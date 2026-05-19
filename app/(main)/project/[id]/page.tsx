"use client";

import { useState, useEffect, use } from "react";
import type { ProjectDetailVO } from "@/lib/types";
import { getPublicDetail } from "@/lib/api/project";
import ArticleContent from "@/app/_components/article/ArticleContent";
import Loading from "@/app/_components/common/Loading";

export default function ProjectDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = use(props.params);
  const [project, setProject] = useState<ProjectDetailVO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await getPublicDetail(Number(id));
        setProject(data);
      } catch {
        setProject(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) return <div className="py-24"><Loading /></div>;
  if (!project) return <div className="text-center py-24 text-slate-400">Project not found.</div>;

  return (
    <>
      <h1 className="text-3xl sm:text-4xl font-black tracking-tighter text-slate-900 dark:text-white">
        {project.name}
      </h1>
      <p className="mt-3 text-slate-500 dark:text-slate-400 text-lg">{project.summary}</p>

      {project.techStack && (
        <div className="flex flex-wrap gap-2 mt-4">
          {project.techStack.split(",").map((t) => (
            <span key={t} className="px-3 py-1 text-xs rounded-full bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 font-medium">
              {t.trim()}
            </span>
          ))}
        </div>
      )}

      {project.githubUrl && (
        <a href={project.githubUrl} target="_blank" rel="noreferrer" className="inline-block mt-4 glass-btn text-sm">
          GitHub &rarr;
        </a>
      )}

      {project.coverImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={project.coverImage} alt="" className="w-full rounded-2xl mt-8 object-cover max-h-96" />
      )}

      <div className="mt-8">
        <ArticleContent content={project.content || ""} />
      </div>
    </>
  );
}
