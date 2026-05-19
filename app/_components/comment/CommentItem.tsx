import type { Comment } from "@/lib/types";

export default function CommentItem({ comment }: { comment: Comment }) {
  const date = comment.createTime
    ? new Date(comment.createTime).toLocaleDateString("zh-CN", { year: "numeric", month: "short", day: "numeric" })
    : "";

  return (
    <div className="glass-card !rounded-2xl p-4">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
          {(comment.authorName || "A")[0].toUpperCase()}
        </div>
        <div>
          <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
            {comment.authorName || "Anonymous"}
          </p>
          <p className="text-[11px] text-slate-400">{date}</p>
        </div>
      </div>
      <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
        {comment.content}
      </p>
    </div>
  );
}
