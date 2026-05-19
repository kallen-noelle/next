"use client";

import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        className="flex-1 min-h-0 flex flex-col"
        initial={{ y: 20, opacity: 0, filter: "blur(4px)" }}
        animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
        exit={{ y: -10, opacity: 0, filter: "blur(2px)" }}
        transition={{ ease: [0.25, 0.46, 0.45, 0.94], duration: 0.35 }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
