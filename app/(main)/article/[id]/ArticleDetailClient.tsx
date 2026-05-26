"use client";

import { useState, useEffect, use } from "react";
import type { ArticleDetailVO } from "@/lib/types";
import { getPublicDetail, addView } from "@/lib/api/article";
import ArticleProse from "@/app/_components/article/ArticleProse";
import ArticleSidebar from "@/app/_components/article/ArticleSidebar";
import ArticleNav from "@/app/_components/article/ArticleNav";
import BackButton from "@/app/_components/article/BackButton";
import ViewCount from "@/app/_components/article/ViewCount";
import Giscus from "@/app/_components/comment/Giscus";
import Loading from "@/app/_components/common/Loading";

export default function ArticleDetailClient(props: { params: Promise<{ id: string }> }) {
  const { id } = use(props.params);
  const [article, setArticle] = useState<ArticleDetailVO | null>(null);
  const [loading, setLoading] = useState(true);
  const [giscusCount, setGiscusCount] = useState<number | null>(null);

  // listen for Giscus discussion metadata to get live comment count
  useEffect(() => {
    function handler(e: MessageEvent) {
      if (e.data?.giscus?.discussion?.totalCommentCount != null) {
        setGiscusCount(e.data.giscus.discussion.totalCommentCount);
      }
    }
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await getPublicDetail(Number(id));
        setArticle(data);
        addView(Number(id)).catch(() => {});
      } catch {
        setArticle(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) return <div className="min-h-screen py-24"><Loading /></div>;
  if (!article) return <div className="text-center py-24 text-slate-400">Article not found.</div>;

  const date = article.createdAt
    ? new Date(article.createdAt).toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" })
    : "";

  return (
    <div className="min-h-screen relative pb-20">
      <div className="flex flex-col lg:flex-row gap-8">
        <article className="flex-1 min-w-0 bg-white/60 dark:bg-slate-800/50 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/40 dark:border-white/10 overflow-hidden">
          {article.coverImage && (
            <div className="overflow-hidden">
              <img src={article.coverImage} alt="" className="w-full aspect-video object-cover transition-transform duration-700 hover:scale-105" />
            </div>
          )}

          <div className="p-5 md:p-10">
            <BackButton />

            <header className="mb-8">
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mb-4">
                <span className="inline-flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  {date}
                </span>
                {article.categoryName && (
                  <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 font-bold text-[10px]">{article.categoryName}</span>
                )}
                <ViewCount count={article.viewCount} />
                <span>{giscusCount ?? article.commentCount} comments</span>
              </div>

              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">
                {article.title}
              </h1>

              {article.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {article.tags.map((tag) => (
                    <span key={tag.id} className="text-xs text-pink-500 dark:text-pink-400 font-medium">
                      #{tag.name}
                    </span>
                  ))}
                </div>
              )}
            </header>

            <ArticleProse content={article.content} />
            <ArticleNav prev={article.prev} next={article.next} />

            <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-700">
              <Giscus />
            </div>
          </div>
        </article>

        <ArticleSidebar content={article.content} />
      </div>
    </div>
  );
}
