import type { Metadata } from "next";
import Timeline from "@/app/_components/timeline/Timeline";
import SkillBar from "@/app/_components/timeline/SkillBar";

export const metadata: Metadata = {
  title: "Timeline",
  description: "学习历程与技能清单，记录技术成长路径和掌握的工具栈。",
};

export default function TimelinePage() {
  return (
    <>
      <h1 className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white mb-2">Timeline</h1>
      <p className="text-slate-500 dark:text-slate-400 mb-8">Learning milestones &amp; skill set.</p>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7">
          <h2 className="text-lg font-black text-slate-700 dark:text-slate-300 mb-4">Milestones</h2>
          <Timeline />
        </div>
        <div className="lg:col-span-5">
          <h2 className="text-lg font-black text-slate-700 dark:text-slate-300 mb-4">Skills</h2>
          <SkillBar />
        </div>
      </div>
    </>
  );
}
