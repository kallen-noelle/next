import EditChatterClient from "./EditChatterClient";

export const revalidate = 0;

export function generateStaticParams() {
  return [];
}

export default function EditChatterPage(props: { params: Promise<{ id: string }> }) {
  return <EditChatterClient params={props.params} />;
}
