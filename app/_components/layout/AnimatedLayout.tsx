"use client";

import { AnimatePresence } from "framer-motion";

export default function AnimatedLayout({ children }: { children: React.ReactNode }) {
  return <AnimatePresence mode="wait">{children}</AnimatePresence>;
}
