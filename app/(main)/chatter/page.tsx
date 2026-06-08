import ChatterClient from "./ChatterClient";
import { chatterMetadata as metadata } from "@/lib/seo";

export { metadata };

export default function ChatterPage() {
  return <ChatterClient />;
}