import type { Metadata } from "next";
import LiteratureList from "@/app/_components/literature/LiteratureList";

export const metadata: Metadata = {
  title: "Literature",
  description: "诗歌、散文、随笔与文学创作，用文字记录思考与情感。",
};

export default function LiteraturePage() {
  return (
    <>
      <h1 className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white mb-2">Literature</h1>
      <p className="text-slate-500 dark:text-slate-400 mb-8">Poetry, prose, and creative writing.</p>
      <LiteratureList />
    </>
  );
}
