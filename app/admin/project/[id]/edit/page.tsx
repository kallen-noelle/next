import EditProjectClient from "./EditProjectClient";

export const revalidate = 0;

export function generateStaticParams() {
  return [];
}

export default function EditProjectPage(props: { params: Promise<{ id: string }> }) {
  return <EditProjectClient params={props.params} />;
}
