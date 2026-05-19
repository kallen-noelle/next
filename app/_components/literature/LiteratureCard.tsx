import Link from "next/link";
import type { OpArticle } from "@/lib/types";

export default function LiteratureCard({ item }: { item: OpArticle }) {
  return (
    <Link href={`/literature/${item.id}`} className="block group">
      <article className="glass-card p-5 h-full transition-all duration-700 hover:scale-[1.01]">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
          {item.title}
        </h3>
        {item.weather && (
          <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500">
            {item.weather}
          </span>
        )}
        {item.writtenAt && (
          <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">{item.writtenAt}</p>
        )}
      </article>
    </Link>
  );
}
