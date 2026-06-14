import TimelineClient from "./TimelineClient";
import { timelineMetadata as metadata, breadcrumbSchema } from "@/lib/seo";

export { metadata };

export default function TimelinePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema([
            { name: "首页", path: "/" },
            { name: "学习历程", path: "/timeline" },
          ])),
        }}
      />
      <span className="sr-only">{metadata.description}</span>
      <TimelineClient />
    </>
  );
}
