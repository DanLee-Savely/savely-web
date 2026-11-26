import type { MetadataRoute } from "next";
import { guideCatalog } from "@/content/guide";
import { homeContent } from "@/content/home.content";
import { sitemapEntries } from "@/lib/guideSeo";

// 주소 목록은 sitemapEntries 한곳에서 관리한다. 게시한 가이드 글은 자동으로 들어간다 (91-content §4-8)
export default function sitemap(): MetadataRoute.Sitemap {
  return sitemapEntries(guideCatalog).map(({ path, lastModified }) => ({
    url: `https://${homeContent.footer.site}${path}`,
    ...(lastModified && { lastModified }),
  }));
}
