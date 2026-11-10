"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { storiesData } from "@/data/storiesData";
import { API_URL, decodeSlug, fetchSite, fetchStories } from "@/lib/api";
import type { SiteChrome, Story } from "@/types";
import NewsGrid from "@/components/news/NewsGrid";
import LeadStoryHero from "@/components/news/LeadStoryHero";
import LatestList from "@/components/news/LatestList";
import AdBanner from "@/components/news/AdBanner";
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
const ENGLISH_SLUGS = ["english-news", "english"];
// Cards shown under the lead story, and how many more each "show more" click reveals.
const PAGE_SIZE = 9;
const LATEST_COUNT = 5;

export default function CategoryClient() {
  const params = useParams<{ slug: string }>();
  const slug = decodeSlug(params.slug);
  const router = useRouter();
  const { language, t } = useLanguage();
  const fallback = useMemo(
    () => storiesData.filter((story) => story.section === slug || story.category.toLowerCase().replace(/\s+/g, "-") === slug),
    [slug],
  );
  const [stories, setStories] = useState<Story[]>(API_URL ? [] : fallback);
  const [latest, setLatest] = useState<Story[]>([]);
  const [loading, setLoading] = useState(Boolean(API_URL));
  const [error, setError] = useState(false);
  const [site, setSite] = useState<SiteChrome | null>(null);
  const [visible, setVisible] = useState(PAGE_SIZE);

  useEffect(() => {
    if (!API_URL) return;
    fetchSite().then(setSite).catch(() => undefined);
    // Site-wide latest headlines for the sidebar.
    fetchStories("?limit=12").then(setLatest).catch(() => undefined);
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
  const isEnglish = ENGLISH_SLUGS.includes(slug);
  const [lead, ...rest] = stories;
  // The sidebar never repeats this category's own stories; English stays out of the Bangla sidebar.
  const sidebar = latest
    .filter((story) => story.section !== slug && (isEnglish || !ENGLISH_SLUGS.includes(story.section || "")))
    .slice(0, LATEST_COUNT);
  const banner = site?.settings.header_banner;

  return (
    <>
      <div className="bg-paper dark:bg-slate-950">
        <div className="mx-auto max-w-6xl px-4 pb-8 pt-5 sm:px-6">
          <nav aria-label="Breadcrumb" className="mb-4 text-sm text-slate-500 dark:text-slate-400">
            <Link href="/" className="hover:text-accent dark:hover:text-amber-400">{t("home")}</Link>
            <span aria-hidden className="mx-2">/</span>
            <span className="font-semibold capitalize text-slate-700 dark:text-slate-200">{heading}</span>
          </nav>
          <div className="mb-6 flex items-end gap-4">
            <h1 className="flex shrink-0 items-center gap-3 font-serif text-3xl font-bold capitalize leading-tight text-brand-dark dark:text-slate-100 sm:text-4xl">
              <span aria-hidden className="h-8 w-1.5 bg-accent dark:bg-amber-400" />
              {heading}
            </h1>
            <span aria-hidden className="mb-2 h-px min-w-4 flex-1 bg-brand/60 dark:bg-slate-700" />
          </div>

          {loading && <p className="text-sm text-slate-500">{t("storiesLoading")}</p>}
          {error && <p className="mb-4 text-sm text-amber-700">{t("serviceDown")}</p>}
          {!loading && !stories.length && !error && <p className="text-sm text-slate-500">{t("noStories")}</p>}

          {lead && (
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-7">
              <div className="min-w-0 self-center">
                <LeadStoryHero story={lead} as="h2" />
              </div>
              {sidebar.length > 0 && (
                <div className="min-w-0 lg:border-l lg:border-slate-300 lg:pl-7 dark:lg:border-slate-800">
                  <LatestList stories={sidebar} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {rest.length > 0 && (
        <main className="border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
          <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
            {/* The compact inner-page header has no banner, so it runs here instead. */}
            {banner && <AdBanner banner={banner} />}
            <NewsGrid
              stories={rest.slice(0, visible)}
              onOpen={(story) => router.push(`/article/${story.id}`)}
              lang={isEnglish ? "en" : undefined}
            />
            {rest.length > visible && (
              <div className="mt-8 flex items-center gap-4">
                <span aria-hidden className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
                <button
                  type="button"
                  onClick={() => setVisible((count) => count + PAGE_SIZE)}
                  className="rounded-md border-2 border-accent px-8 py-2 text-sm font-bold text-accent transition hover:bg-accent hover:text-white dark:border-amber-400 dark:text-amber-400 dark:hover:bg-amber-400 dark:hover:text-slate-950"
                >
                  {t("loadMore")} ↓
                </button>
                <span aria-hidden className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
              </div>
            )}
          </div>
        </main>
      )}
    </>
  );
}
