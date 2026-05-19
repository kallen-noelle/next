"use client";

import { useState } from "react";
import { useAuthStore } from "@/stores/authStore";
import { create } from "@/lib/api/comment";
import Link from "next/link";

export default function CommentForm({ articleId, onSuccess }: { articleId: number; onSuccess: () => void }) {
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setSubmitting(true);
    try {
      await create({ articleId, content: content.trim() });
      setContent("");
      onSuccess();
    } catch {
      // silent
    } finally {
      setSubmitting(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="glass-card !rounded-2xl p-5 text-center">
        <p className="text-sm text-slate-400 dark:text-slate-500">
          Please{" "}
          <Link href="/auth/login" className="text-indigo-500 hover:underline font-bold">
            sign in
          </Link>{" "}
          to leave a comment.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="glass-card !rounded-2xl p-5">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write a comment..."
        rows={3}
        className="w-full bg-transparent text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 resize-none outline-none"
      />
      <div className="flex justify-end mt-2">
        <button
          type="submit"
          disabled={!content.trim() || submitting}
          className="px-5 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-40"
        >
          {submitting ? "Sending..." : "Submit"}
        </button>
      </div>
    </form>
  );
}
