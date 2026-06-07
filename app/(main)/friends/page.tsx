import FriendsBoard from "./FriendsBoard";

export const metadata = {
  title: "友情链接",
  description: "赛博空间里的有趣灵魂",
  openGraph: {
    title: "友情链接 | Dream Blog - 个人技术博客与作品集",
    description: "赛博空间里的有趣灵魂",
    images: [{ url: "/bg/7.JPG", width: 1200, height: 630 }],
  },
};

export default function FriendsPage() {
  return <FriendsBoard />;
}
