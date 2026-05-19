"use client";

import { useState, useEffect, use } from "react";
import type { ArticleDetailVO } from "@/lib/types";
import { getPublicDetail, addView } from "@/lib/api/article";
import ArticleContent from "@/app/_components/article/ArticleContent";
import ArticleTOC from "@/app/_components/article/ArticleTOC";
import ArticleNav from "@/app/_components/article/ArticleNav";
import CommentList from "@/app/_components/comment/CommentList";
import CommentForm from "@/app/_components/comment/CommentForm";
import Loading from "@/app/_components/common/Loading";

export default function ArticleDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = use(props.params);
  const [article, setArticle] = useState<ArticleDetailVO | null>(null);
  const [loading, setLoading] = useState(true);
  const [commentKey, setCommentKey] = useState(0);

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

  if (loading) return <div className="py-24"><Loading /></div>;
  if (!article) return <div className="text-center py-24 text-slate-400">Article not found.</div>;

  const date = article.createdAt
    ? new Date(article.createdAt).toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" })
    : "";

  return (
    <>
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 mb-3">
          <span>{article.categoryName}</span>
          <span>·</span>
          <span>{date}</span>
          <span>·</span>
          <span>{article.viewCount} views</span>
          <span>·</span>
          <span>{article.commentCount} comments</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tighter text-slate-900 dark:text-white">
          {article.title}
        </h1>
        {article.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-4">
            {article.tags.map((tag) => (
              <span key={tag.id} className="px-3 py-1 text-[11px] rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-medium">
                {tag.name}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-10">
        <div className="flex-1 min-w-0">
          {article.coverImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={article.coverImage} alt="" className="w-full rounded-2xl mb-8 object-cover max-h-96" />
          )}
          <ArticleContent content={article.content} />
          <ArticleNav prev={article.prev} next={article.next} />

          <div className="mt-12">
            <CommentForm
              articleId={article.id}
              onSuccess={() => setCommentKey((k) => k + 1)}
            />
            <div className="mt-6">
              <CommentList key={commentKey} articleId={article.id} />
            </div>
          </div>
        </div>

        <aside className="hidden lg:block w-56 flex-shrink-0">
          <div className="sticky top-28">
            <ArticleTOC content={article.content} />
          </div>
        </aside>
      </div>
    </>
  );
}
