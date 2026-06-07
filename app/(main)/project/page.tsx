import type { Metadata } from "next";
import ProjectList from "@/app/_components/project/ProjectList";

export const metadata: Metadata = {
  title: "项目实践与开源探索",
  description: "代码项目与实验记录，涵盖全栈开发、开源工具和有趣的技术尝试。",
  openGraph: {
    title: "项目实践与开源探索 | Dream Blog - 个人技术博客与作品集",
    description: "代码项目与实验记录，涵盖全栈开发、开源工具和有趣的技术尝试。",
    images: [{ url: "/bg/3.jpg", width: 1200, height: 630 }],
  },
};

export default function ProjectPage() {
  return (
    <>
      <h1 className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white mb-2">Projects</h1>
      <p className="text-slate-500 dark:text-slate-400 mb-8">Code, experiments, and builds.</p>
      <ProjectList />
    </>
  );
}
