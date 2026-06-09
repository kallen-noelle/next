"use client";

import { useEffect, useState } from "react";

export default function ViewCount({ count }: { count: number }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_IS_STATIC === "true") setVisible(false);
  }, []);

  if (!visible) return null;
  return <span>{count} views</span>;
}
