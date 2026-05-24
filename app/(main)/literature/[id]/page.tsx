import LiteratureDetailClient from "./LiteratureDetailClient";

export const revalidate = 0;

export function generateStaticParams() {
  return [];
}

export default function LiteratureDetailPage(props: { params: Promise<{ id: string }> }) {
  return <LiteratureDetailClient params={props.params} />;
}
