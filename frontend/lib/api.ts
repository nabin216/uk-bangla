import type { ArticleComment, LocalizedText, SiteChrome, Story } from "@/types";

export const API_URL = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");

type Dual = { en?: string; bn?: string };

type ApiArticle = {
  id: number | string;
  slug: string;
  title: Dual;
  excerpt?: Dual;
  body: Dual;
  pull_quote?: Dual;
  category: { name: string; name_bn?: string; slug: string };
  author: { name?: string; name_en?: string; name_bn?: string; role?: Dual; bio?: Dual };
  date?: string;
  image?: string | null;
  image_caption?: Dual;
  image_credit?: string;
  source_url?: string;
  read_minutes?: number;
  read_count?: number;
  comment_count?: number | null;
  is_featured?: boolean;
  is_sponsored?: boolean;
};

const dual = (value?: Dual): LocalizedText => ({
  en: value?.en || value?.bn || "",
  bn: value?.bn || value?.en || "",
});

const stripHtml = (value: string) =>
  value.replace(/<[^>]*>/g, " ").replace(/&[a-z]+;/gi, " ").replace(/\s+/g, " ").trim();

export function toStory(article: ApiArticle): Story {
  const image = article.image && article.image.startsWith("/") ? `${API_URL}${article.image}` : article.image;
  const authorName = article.author?.name || article.author?.name_en || "UK Bangla Guardian";
  return {
    id: article.slug || String(article.id),
    category: article.category?.name || "News",
    categoryBn: article.category?.name_bn || article.category?.name || "News",
    section: article.category?.slug,
    author: authorName,
    authorBn: article.author?.name_bn || authorName,
    authorRole: dual(article.author?.role),
    authorBio: dual(article.author?.bio),
    date: article.date ? new Date(article.date).toLocaleDateString("en-GB") : "",
    image: image || "/uk-bangla-guardian-logo-1.png",
    imageCaption: dual(article.image_caption),
    imageCredit: article.image_credit || "",
    sourceUrl: article.source_url,
    readMinutes: article.read_minutes,
    readCount: article.read_count,
    commentCount: article.comment_count ?? undefined,
    featured: article.is_featured,
    sponsored: article.is_sponsored,
    title: { en: article.title?.en || "", bn: article.title?.bn || article.title?.en || "" },
    body: {
      en: article.body?.en || article.excerpt?.en || "",
      bn: article.body?.bn || article.body?.en || article.excerpt?.bn || "",
    },
    excerpt: {
      en: article.excerpt?.en || stripHtml(article.body?.en || ""),
      bn: article.excerpt?.bn || stripHtml(article.body?.bn || article.body?.en || ""),
    },
    pullQuote: dual(article.pull_quote),
  };
}

export async function fetchSite(): Promise<SiteChrome> {
  if (!API_URL) throw new Error("API is not configured");
  const response = await fetch(`${API_URL}/api/site/`, { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`Site request failed (${response.status})`);
  return response.json();
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

export async function fetchComments(slug: string): Promise<ArticleComment[]> {
  if (!API_URL) throw new Error("API is not configured");
  const response = await fetch(`${API_URL}/api/stories/${encodeURIComponent(slug)}/comments/`, {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error("Comments request failed");
  const data = await response.json();
  return data.results || [];
}

export async function postComment(slug: string, input: { name: string; body: string }): Promise<ArticleComment> {
  if (!API_URL) throw new Error("API is not configured");
  const response = await fetch(`${API_URL}/api/stories/${encodeURIComponent(slug)}/comments/`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.detail || `Could not post comment (${response.status})`);
  }
  return response.json();
}

export async function submitNewsletter(email: string) {
  if (!API_URL) throw new Error("API is not configured");
  const response = await fetch(`${API_URL}/api/newsletter/subscribe/`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.detail || `Subscription failed (${response.status})`);
  }
}
