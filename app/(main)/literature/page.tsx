import LiteratureList from "@/app/_components/literature/LiteratureList";

export default function LiteraturePage() {
  return (
    <>
      <h1 className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white mb-2">Literature</h1>
      <p className="text-slate-500 dark:text-slate-400 mb-8">Poetry, prose, and creative writing.</p>
      <LiteratureList />
    </>
  );
}
