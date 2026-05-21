import Link from "next/link";
import type { ArticleNav as ArticleNavType } from "@/lib/types";

export default function ArticleNav({ prev, next, basePath = "/article" }: { prev: ArticleNavType | null; next: ArticleNavType | null; basePath?: string }) {
  return (
    <div className="grid grid-cols-2 gap-4 mt-10">
      {prev ? (
        <Link href={`${basePath}/${prev.id}`} className="glass-card p-4 group hover:border-indigo-400 transition-colors">
          <span className="text-[10px] uppercase tracking-widest text-slate-400">Previous</span>
          <p className="mt-1 text-sm font-bold text-slate-700 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
            {prev.title}
          </p>
        </Link>
      ) : <div />}
      {next ? (
        <Link href={`${basePath}/${next.id}`} className="glass-card p-4 text-right group hover:border-indigo-400 transition-colors">
          <span className="text-[10px] uppercase tracking-widest text-slate-400">Next</span>
          <p className="mt-1 text-sm font-bold text-slate-700 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
            {next.title}
          </p>
        </Link>
      ) : <div />}
    </div>
  );
}
