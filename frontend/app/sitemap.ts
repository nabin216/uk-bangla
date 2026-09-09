import type { MetadataRoute } from "next";
import { API_URL } from "@/lib/api";

const BASE = "https://ukbanglaguardian.com";
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const routes: MetadataRoute.Sitemap = [
    { url: BASE, changeFrequency: "hourly", priority: 1 },
    { url: `${BASE}/about`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE}/contact`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE}/privacy`, changeFrequency: "yearly", priority: 0.2 },
  ];
  if (!API_URL) return routes;
  try {
    const [siteRes, storyRes] = await Promise.all([
      fetch(`${API_URL}/api/site/`, { next: { revalidate: 3600 } }),
      fetch(`${API_URL}/api/stories/?limit=200`, { next: { revalidate: 3600 } }),
    ]);
    const site = await siteRes.json();
    const stories = await storyRes.json();
    for (const section of site.sections ?? []) {
      routes.push({ url: `${BASE}/category/${section.slug}`, changeFrequency: "daily", priority: 0.6 });
    }
    for (const article of stories.results ?? []) {
      routes.push({
        url: `${BASE}/article/${article.slug}`,
        lastModified: article.date ? new Date(article.date) : undefined,
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }
  } catch {
    // fall back to the static routes
  }
  return routes;
}
