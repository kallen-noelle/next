"use client";

import { useEffect, useState } from "react";
import { detectMode } from "@/lib/static-data";

export default function ViewCount({ count }: { count: number }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    detectMode().then((m) => {
      if (m === "static") setVisible(false);
    });
  }, []);

  if (!visible) return null;
  return <span>{count} views</span>;
}
