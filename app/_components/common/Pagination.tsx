"use client";

interface Props {
  pageNum: number;
  pageSize: number;
  total: number;
  onChange: (page: number) => void;
}

export default function Pagination({ pageNum, pageSize, total, onChange }: Props) {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;

  const pages: number[] = [];
  for (let i = 1; i <= totalPages; i++) pages.push(i);

  return (
    <div className="flex items-center justify-center gap-1 mt-8">
      <button
        disabled={pageNum <= 1}
        onClick={() => onChange(pageNum - 1)}
        className="glass-btn !px-2.5 disabled:opacity-30"
      >
        &laquo;
      </button>
      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={
            p === pageNum
              ? "px-3 py-1 rounded-lg bg-indigo-500 text-white text-sm font-bold"
              : "glass-btn !px-3"
          }
        >
          {p}
        </button>
      ))}
      <button
        disabled={pageNum >= totalPages}
        onClick={() => onChange(pageNum + 1)}
        className="glass-btn !px-2.5 disabled:opacity-30"
      >
        &raquo;
      </button>
    </div>
  );
}
