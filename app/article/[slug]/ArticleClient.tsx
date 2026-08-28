"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import StoryModal from "@/components/news/StoryModal";
import { storiesData } from "@/data/storiesData";
import { API_URL, fetchStory } from "@/lib/api";
import type { Story } from "@/types";
import { LanguageProvider } from "@/context/LanguageContext";
import { SavedArticlesProvider } from "@/context/SavedArticlesContext";

export default function ArticleClient() {
  const { slug } = useParams<{ slug: string }>();
  const [story, setStory] = useState<Story | null>(API_URL ? null : storiesData.find((item) => item.id === slug) || null);
  const [loading, setLoading] = useState(Boolean(API_URL));
  const [error, setError] = useState(false);
  useEffect(() => { if (!API_URL) return; fetchStory(slug).then(setStory).catch(() => { setError(true); setStory(storiesData.find((item) => item.id === slug) || null); }).finally(() => setLoading(false)); }, [slug]);
  return <LanguageProvider><SavedArticlesProvider><><Header onSaved={() => undefined} onCategory={() => undefined} onSearch={() => undefined} dark={false} onTheme={() => undefined} />{loading ? <main className="mx-auto max-w-3xl p-12">Loading story…</main> : story ? <><StoryModal story={story} onClose={() => history.back()} />{error && <p className="fixed bottom-4 left-1/2 z-[60] -translate-x-1/2 rounded bg-amber-100 px-4 py-2 text-sm text-amber-900">News service unavailable; showing bundled story.</p>}</> : <main className="mx-auto max-w-3xl p-12">{error ? "Unable to load this story." : "Story not found."}</main>}<Footer /></></SavedArticlesProvider></LanguageProvider>;
}
