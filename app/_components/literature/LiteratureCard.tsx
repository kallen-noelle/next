import Link from "next/link";
import type { OpArticle } from "@/lib/types";

export default function LiteratureCard({ item }: { item: OpArticle }) {
  return (
    <Link href={`/literature/${item.id}`} className="block group">
      <article className="relative rounded-xl bg-indigo-50/30 dark:bg-indigo-900/10 p-5 md:p-6 transition-all duration-500 hover:bg-indigo-100/40 dark:hover:bg-indigo-800/20 border-l-[3px] border-indigo-300/40 dark:border-indigo-600/30 shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:border-indigo-400 dark:hover:border-indigo-500">
        <div className="text-4xl md:text-5xl text-indigo-300/40 dark:text-indigo-500/30 leading-none mb-3 select-none">
          &ldquo;
        </div>

        {item.content && (
          <p className="text-sm md:text-base leading-relaxed text-center text-slate-600 dark:text-slate-300 line-clamp-4 whitespace-pre-line">
            {item.content}
          </p>
        )}

        <div className="text-right text-4xl md:text-5xl text-indigo-300/40 dark:text-indigo-500/30 leading-none mt-2 select-none">
          &rdquo;
        </div>

        <p className="text-right text-xs text-slate-400 dark:text-slate-500 mt-1 transition-colors duration-500 group-hover:text-indigo-500 dark:group-hover:text-indigo-300">
          —— {item.title}
          {item.writtenAt && (
            <> · {new Date(item.writtenAt).toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" })}</>
          )}
        </p>
      </article>
    </Link>
  );
}
