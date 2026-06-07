import GalleryClient from "./GalleryClient";

export const metadata = {
  title: "摄影图库与相册",
  description: "Photo albums and collections.",
  openGraph: {
    title: "摄影图库与相册 | Dream Blog - 个人技术博客与作品集",
    description: "Photo albums and collections.",
    images: [{ url: "/bg/5.PNG", width: 1200, height: 630 }],
  },
};

export default function GalleryPage() {
  return <GalleryClient />;
}
