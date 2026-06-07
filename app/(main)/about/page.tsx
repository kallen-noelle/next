import type { Metadata } from "next";
import AboutClient from "./AboutClient";

export const metadata: Metadata = {
  title: "关于博主",
  description: "关于博主的信息，包括个人简介、技术栈和联系方式。",
  openGraph: {
    title: "关于博主 | Dream Blog - 个人技术博客与作品集",
    description: "关于博主的信息，包括个人简介、技术栈和联系方式。",
    images: [{ url: "/bg/8.JPG", width: 1200, height: 630 }],
  },
};

export default function AboutPage() {
  return <AboutClient />;
}
