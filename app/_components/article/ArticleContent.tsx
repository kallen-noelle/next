"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";

export default function ArticleContent({ content }: { content: string }) {
  return (
    <div className="prose prose-slate dark:prose-invert max-w-none
      prose-headings:font-black prose-headings:tracking-tight
      prose-a:text-indigo-500 prose-a:no-underline hover:prose-a:underline
      prose-code:bg-indigo-50 dark:prose-code:bg-indigo-900/20 prose-code:text-indigo-600 dark:prose-code:text-indigo-400 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-sm
      prose-pre:bg-[#282c34] prose-pre:rounded-xl
      prose-blockquote:border-l-4 prose-blockquote:border-indigo-400 prose-blockquote:bg-indigo-50/50 dark:prose-blockquote:bg-indigo-900/10 prose-blockquote:rounded-r-xl prose-blockquote:py-1 prose-blockquote:px-4
      prose-img:rounded-2xl
    ">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
