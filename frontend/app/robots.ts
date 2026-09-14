import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin/", "/django-admin/", "/api/"] },
    sitemap: "https://ukbanglaguardian.com/sitemap.xml",
    host: "https://ukbanglaguardian.com",
  };
}
