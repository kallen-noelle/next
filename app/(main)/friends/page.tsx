import FriendsBoard from "./FriendsBoard";
import { friendsMetadata as metadata, breadcrumbSchema } from "@/lib/seo";

export { metadata };

export default function FriendsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema([
            { name: "首页", path: "/" },
            { name: "友情链接", path: "/friends" },
          ])),
        }}
      />
      <span className="sr-only">{metadata.description}</span>
      <FriendsBoard />
    </>
  );
}
