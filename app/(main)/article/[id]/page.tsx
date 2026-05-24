import ArticleDetailClient from "./ArticleDetailClient";

export const revalidate = 0;

export function generateStaticParams() {
  return [];
}

export default function ArticleDetailPage(props: { params: Promise<{ id: string }> }) {
  return <ArticleDetailClient params={props.params} />;
}
