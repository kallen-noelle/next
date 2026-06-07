import ChatterClient from "./ChatterClient";

export const metadata = {
  title: "说说与杂谈",
  description: "日常碎片、思考记录与灵感分享",
  openGraph: {
    title: "说说与杂谈 | Dream Blog - 个人技术博客与作品集",
    description: "日常碎片、思考记录与灵感分享",
    images: [{ url: "/bg/5.PNG", width: 1200, height: 630 }],
  },
};

export default function ChatterPage() {
  return <ChatterClient />;
}