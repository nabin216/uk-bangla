import type { Metadata } from "next";
import { API_URL, fetchStory } from "@/lib/api";
import ArticleClient from "./ArticleClient";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  if (!API_URL) return {};
  try {
    const story = await fetchStory(slug);
    const title = story.title.en || story.title.bn;
    const description = story.excerpt?.en || story.excerpt?.bn || undefined;
    const images = story.image ? [story.image] : undefined;
    return {
      title,
      description,
      openGraph: { type: "article", title, description, images },
      twitter: { card: "summary_large_image", title, description, images },
    };
  } catch {
    return {};
  }
}

export default function ArticlePage() {
  return <ArticleClient />;
}
