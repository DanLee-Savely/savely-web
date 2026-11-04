import type { MetadataRoute } from "next";
import { homeContent } from "@/content/home.content";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["/home", "/home/privacy"].map((path) => ({
    url: `https://${homeContent.footer.site}${path}`,
  }));
}
