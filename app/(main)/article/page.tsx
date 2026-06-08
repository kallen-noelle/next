import ArticleListClient from "./ArticleListClient";
import { articleMetadata as metadata } from "@/lib/seo";

export { metadata };

export default function ArticlePage() {
  return <ArticleListClient />;
}
