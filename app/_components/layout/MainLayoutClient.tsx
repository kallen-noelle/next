"use client";

import { usePathname } from "next/navigation";
import AnimatedLayout from "./AnimatedLayout";

export default function MainLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isChatter = pathname.startsWith("/chatter");
  const isHome = pathname === "/";

  return (
    <main
      className={`flex-1 w-full ${isHome ? "" : "mt-28"} ${isChatter
          ? ""
          : "max-w-6xl mx-auto px-4 sm:px-6 lg:px-10"
        }`}
    >
      <AnimatedLayout>{children}</AnimatedLayout>
    </main>
  );
}