import EditArticleClient from "./EditArticleClient";

export const revalidate = 0;

export function generateStaticParams() {
  return [];
}

export default function EditArticlePage(props: { params: Promise<{ id: string }> }) {
  return <EditArticleClient params={props.params} />;
}
