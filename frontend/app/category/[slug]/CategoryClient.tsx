"use client";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { storiesData } from "@/data/storiesData";
import { API_URL, decodeSlug, fetchSite, fetchStories } from "@/lib/api";
import type { SiteChrome, Story } from "@/types";
import NewsGrid from "@/components/news/NewsGrid";
import { useLanguage } from "@/context/LanguageContext";

const CATEGORY_NAMES_BN: Record<string, string> = {
  uk: "যুক্তরাজ্য",
  bangladesh: "বাংলাদেশ",
  world: "বিশ্ব",
  business: "বাণিজ্য",
  culture: "সংস্কৃতি",
  opinion: "মতামত",
  "english-news": "ইংরেজি সংবাদ",
};

export default function CategoryClient() {
  const params = useParams<{ slug: string }>();
  const slug = decodeSlug(params.slug);
  const router = useRouter();
  const { language } = useLanguage();
  const fallback = useMemo(
    () => storiesData.filter((story) => story.section === slug || story.category.toLowerCase().replace(/\s+/g, "-") === slug),
    [slug],
  );
  const [stories, setStories] = useState<Story[]>(API_URL ? [] : fallback);
  const [loading, setLoading] = useState(Boolean(API_URL));
  const [error, setError] = useState(false);
  const [site, setSite] = useState<SiteChrome | null>(null);

  useEffect(() => {
    if (!API_URL) return;
    fetchSite().then(setSite).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!API_URL) return;
    fetchStories(`?category=${encodeURIComponent(slug)}&limit=24`)
      .then(setStories)
      .catch(() => { setError(true); setStories(fallback); })
      .finally(() => setLoading(false));
  }, [slug, fallback]);

  const section = site?.sections.find((item) => item.slug === slug);
  const heading = language === "bn"
    ? section?.name_bn || CATEGORY_NAMES_BN[slug] || slug.replace(/-/g, " ")
    : section?.name || slug.replace(/-/g, " ");

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="mb-8 font-serif text-4xl font-bold capitalize">{heading}</h1>
      {loading && <p className="text-sm text-slate-500">Loading stories…</p>}
      {error && <p className="mb-4 text-sm text-red-600">Unable to load this category. Showing bundled stories.</p>}
      {!loading && !stories.length && !error && <p className="text-sm text-slate-500">No stories found.</p>}
      <NewsGrid stories={stories} onOpen={(story) => router.push(`/article/${story.id}`)} />
    </main>
  );
}
