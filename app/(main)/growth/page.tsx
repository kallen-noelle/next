import type { Metadata } from "next";
import GrowthClient from "./GrowthClient";

export const metadata: Metadata = {
  title: "Growth — 博客成长记录",
  description: "从第一行代码开始的每一次提交，记录栏轩阁博客的技术演进历程。",
  openGraph: {
    title: "Growth — 博客成长记录",
    description: "从第一行代码开始的每一次提交，记录栏轩阁博客的技术演进历程。",
  },
};

export default function GrowthPage() {
  return <GrowthClient />;
}
