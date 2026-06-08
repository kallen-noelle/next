import ProjectList from "@/app/_components/project/ProjectList";
import { projectMetadata as metadata } from "@/lib/seo";

export { metadata };

export default function ProjectPage() {
  return (
    <>
      <h1 className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white mb-2">Projects</h1>
      <p className="text-slate-500 dark:text-slate-400 mb-8">Code, experiments, and builds.</p>
      <ProjectList />
    </>
  );
}
