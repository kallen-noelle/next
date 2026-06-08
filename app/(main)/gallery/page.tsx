import GalleryClient from "./GalleryClient";
import { galleryMetadata as metadata } from "@/lib/seo";

export { metadata };

export default function GalleryPage() {
  return <GalleryClient />;
}
