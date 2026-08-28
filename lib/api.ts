import type { Story } from "@/types";

const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL || "";
export const API_URL = (configuredApiUrl || (process.env.NODE_ENV === "development" ? "http://localhost:8000" : "")).replace(/\/$/, "");

type ApiArticle = {
  id: number | string;
  slug: string;
  title: { en: string; bn: string };
  excerpt?: { en: string; bn: string };
  body: { en: string; bn: string };
  category: { name: string; name_bn?: string; slug: string };
  author: { name_en?: string; name_bn?: string };
  date?: string;
  image?: string | null;
  source_url?: string;
};

export function toStory(article: ApiArticle): Story {
  return {
    id: article.slug || String(article.id),
    category: article.category?.name || "News",
    section: article.category?.slug,
    author: article.author?.name_en || "UK Bangla Guardian",
    date: article.date ? new Date(article.date).toLocaleDateString("en-GB") : "",
    image: article.image || "/uk-bangla-guardian-logo-1.png",
    sourceUrl: article.source_url,
    title: article.title,
    body: {
      en: article.excerpt?.en || article.body.en,
      bn: article.excerpt?.bn || article.body.bn,
    },
  };
}

export async function fetchStories(params = ""): Promise<Story[]> {
  if (!API_URL) throw new Error("API is not configured");
  const response = await fetch(`${API_URL}/api/stories/${params}`, { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`API request failed (${response.status})`);
  const data = await response.json();
  return (data.results || []).map(toStory);
}

export async function fetchStory(slug: string): Promise<Story> {
  if (!API_URL) throw new Error("API is not configured");
  const response = await fetch(`${API_URL}/api/stories/${encodeURIComponent(slug)}/`);
  if (!response.ok) throw new Error("Story not found");
  return toStory(await response.json());
}

export async function fetchMostRead(limit = 10): Promise<Story[]> {
  if (!API_URL) throw new Error("API is not configured");
  const response = await fetch(`${API_URL}/api/most-read/?limit=${limit}`);
  if (!response.ok) throw new Error("Most-read request failed");
  const data = await response.json();
  return (data.results || []).map(toStory);
}

export async function submitNewsletter(email: string) {
  if (!API_URL) throw new Error("API is not configured");
  const response = await fetch(`${API_URL}/api/newsletter/subscribe/`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!response.ok) throw new Error("Subscription failed");
}
