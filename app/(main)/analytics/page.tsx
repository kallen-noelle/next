import AnalyticsClient from "./AnalyticsClient";
import { analyticsMetadata as metadata, breadcrumbSchema } from "@/lib/seo";

export { metadata };

export default function AnalyticsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema([
            { name: "首页", path: "/" },
            { name: "网站统计", path: "/analytics" },
          ])),
        }}
      />
      <span className="sr-only">{metadata.description}</span>
      <AnalyticsClient />
    </>
  );
}
