import type { MetadataRoute } from "next";
import { homeContent } from "@/content/home.content";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/home/api/" },
    sitemap: `https://${homeContent.footer.site}/sitemap.xml`,
  };
}
