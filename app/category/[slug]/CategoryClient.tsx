"use client";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { storiesData } from "@/data/storiesData";
import { API_URL, fetchStories } from "@/lib/api";
import type { Story } from "@/types";
import { LanguageProvider } from "@/context/LanguageContext";
import { SavedArticlesProvider } from "@/context/SavedArticlesContext";
import NewsGrid from "@/components/news/NewsGrid";
export default function CategoryClient() {
  const { slug } = useParams<{ slug: string }>();
  const fallback = useMemo(() => storiesData.filter((story) => story.section === slug || story.category.toLowerCase().replace(/\s+/g, "-") === slug), [slug]);
  const [stories, setStories] = useState<Story[]>(API_URL ? [] : fallback);
  const [loading, setLoading] = useState(Boolean(API_URL));
  const [error, setError] = useState(false);
  useEffect(() => { if (!API_URL) return; fetchStories(`?category=${encodeURIComponent(slug)}&limit=50`).then(setStories).catch(() => { setError(true); setStories(fallback); }).finally(() => setLoading(false)); }, [slug, fallback]);
  return <LanguageProvider><SavedArticlesProvider><main className="mx-auto max-w-5xl px-6 py-12"><h1 className="mb-8 font-serif text-4xl font-bold capitalize">{slug.replace(/-/g, " ")}</h1>{loading && <p className="text-sm text-slate-500">Loading stories…</p>}{error && <p className="mb-4 text-sm text-red-600">Unable to load this category. Showing bundled stories.</p>} {!loading && !stories.length && !error && <p className="text-sm text-slate-500">No stories found.</p>}<NewsGrid stories={stories} onOpen={() => undefined} /></main></SavedArticlesProvider></LanguageProvider>;
}
