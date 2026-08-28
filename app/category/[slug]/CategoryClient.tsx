"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { storiesData } from "@/data/storiesData";
import { fetchStories } from "@/lib/api";
import type { Story } from "@/types";
import { LanguageProvider } from "@/context/LanguageContext";
import { SavedArticlesProvider } from "@/context/SavedArticlesContext";
import NewsGrid from "@/components/news/NewsGrid";
export default function CategoryClient() {
  const { slug } = useParams<{ slug: string }>();
  const fallback = storiesData.filter((story) => story.category.toLowerCase().replace(/\s+/g, "-") === slug);
  const [stories, setStories] = useState<Story[]>(fallback);
  useEffect(() => { fetchStories(`?category=${encodeURIComponent(slug)}&limit=50`).then((result) => { if (result.length) setStories(result); }).catch(() => undefined); }, [slug]);
  return <LanguageProvider><SavedArticlesProvider><main className="mx-auto max-w-5xl px-6 py-12"><h1 className="mb-8 font-serif text-4xl font-bold capitalize">{slug.replace(/-/g, " ")}</h1><NewsGrid stories={stories} onOpen={() => undefined} /></main></SavedArticlesProvider></LanguageProvider>;
}
