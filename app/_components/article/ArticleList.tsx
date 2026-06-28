"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { ArticleVO, ArticleQueryDTO } from "@/lib/types";
import { getPublicList } from "@/lib/api/article";
import ArticleCard from "./ArticleCard";
import Pagination from "../common/Pagination";
import Loading from "../common/Loading";

interface Props {
  categoryId?: number;
  tagId?: number;
  keyword?: string;
  showPinnedOnly?: boolean;
}

export default function ArticleList({ categoryId, tagId, keyword, showPinnedOnly }: Props) {
  const [articles, setArticles] = useState<ArticleVO[]>([]);
  const [total, setTotal] = useState(0);
  const [pageNum, setPageNum] = useState(1);
  const [loading, setLoading] = useState(true);
  const pageSize = 9;
  const mountedRef = useRef(false);

  useEffect(() => {
    if (mountedRef.current) {
      setPageNum(1);
    }
    mountedRef.current = true;
  }, [categoryId, tagId, keyword, showPinnedOnly]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const query: ArticleQueryDTO = { isPublished: true };
        if (categoryId) query.categoryId = categoryId;
        if (tagId) query.tagId = tagId;
        if (keyword) query.keyword = keyword;
        const data = await getPublicList({ pageNum, pageSize, query });
        if (!cancelled) {
          let filtered = data.rows;
          if (showPinnedOnly) {
            filtered = filtered.filter((a: ArticleVO) => a.isPinned === 1);
          }
          setArticles(filtered);
          setTotal(showPinnedOnly ? filtered.length : data.total);
        }
      } catch {
        if (!cancelled) {
          setArticles([]);
          setTotal(0);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [pageNum, categoryId, tagId, keyword, showPinnedOnly]);

  if (loading) return <Loading />;

  if (articles.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-20"
      >
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
          <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <p className="text-lg font-semibold text-slate-600 dark:text-slate-300 mb-2">
          {showPinnedOnly ? "暂无精选文章" : "暂无文章"}
        </p>
        <p className="text-sm text-slate-400 dark:text-slate-500">
          {keyword ? "试试其他关键词" : "敬请期待更多内容"}
        </p>
      </motion.div>
    );
  }

  return (
    <div>
      <AnimatePresence mode="wait">
        <motion.div
          key={`${categoryId}-${tagId}-${keyword}-${showPinnedOnly}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {articles.map((article, index) => (
            <motion.div
              key={article.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <ArticleCard article={article} />
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>
      {!showPinnedOnly && total > pageSize && (
        <div className="mt-8">
          <Pagination pageNum={pageNum} pageSize={pageSize} total={total} onChange={setPageNum} />
        </div>
      )}
    </div>
  );
}