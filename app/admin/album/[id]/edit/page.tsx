import EditAlbumClient from "./EditAlbumClient";

export const revalidate = 0;

export function generateStaticParams() {
  return [];
}

export default function EditAlbumPage(props: { params: Promise<{ id: string }> }) {
  return <EditAlbumClient params={props.params} />;
}
