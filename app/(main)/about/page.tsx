import type { Metadata } from "next";
import AboutClient from "./AboutClient";

export const metadata: Metadata = {
  title: "About",
  description: "关于博主的信息，包括个人简介、技术栈和联系方式。",
};

export default function AboutPage() {
  return <AboutClient />;
}
