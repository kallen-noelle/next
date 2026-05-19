"use client";

import { useState, useEffect } from "react";
import type { Comment } from "@/lib/types";
import { getList } from "@/lib/api/comment";
import CommentItem from "./CommentItem";
import Loading from "../common/Loading";

export default function CommentList({ articleId }: { articleId: number }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await getList({
          pageNum: 1,
          pageSize: 50,
          query: { articleId } as Comment,
        });
        if (!cancelled) setComments(data.rows);
      } catch {
        if (!cancelled) setComments([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [articleId]);

  return (
    <div>
      <h3 className="text-lg font-black text-slate-900 dark:text-white mb-4">
        Comments ({comments.length})
      </h3>
      {loading ? (
        <Loading />
      ) : comments.length === 0 ? (
        <p className="text-sm text-slate-400 dark:text-slate-500 py-8 text-center">
          No comments yet. Be the first!
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {comments.map((c) => (
            <CommentItem key={c.id} comment={c} />
          ))}
        </div>
      )}
    </div>
  );
}
