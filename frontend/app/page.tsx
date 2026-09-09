"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import TickerBanner from "@/components/news/TickerBanner";
import LeadStoryHero from "@/components/news/LeadStoryHero";
import CategoryGrid from "@/components/news/CategoryGrid";
import NewsGrid from "@/components/news/NewsGrid";
import SponsoredCard from "@/components/news/SponsoredCard";
import MostRead from "@/components/news/MostRead";
import AdBanner from "@/components/news/AdBanner";
import ReaderPoll from "@/components/widgets/ReaderPoll";
import Newsletter from "@/components/widgets/Newsletter";
import { storiesData } from "@/data/storiesData";
import { useLanguage } from "@/context/LanguageContext";
import type { HomeHeadings, SiteChrome, Story } from "@/types";
import { API_URL, fetchMostRead, fetchSite, fetchStories } from "@/lib/api";

const MOST_READ_FALLBACK = ["story-6", "opinion-demo", "story-3", "story-5"];
const FALLBACK_HEADINGS: Record<keyof HomeHeadings, string> = {
  lead: "Today's essential stories",
  across: "Across Britain & Bangladesh",
  more: "More from the Guardian",
  opinion: "Most read",
};
const ACROSS_SECTIONS = ["uk", "bangladesh"];

export default function Home() {
  const router = useRouter();
  const { language } = useLanguage();
  const openStory = (story: Story) => router.push(`/article/${story.id}`);
  const [searchQuery] = useState(() => typeof window === "undefined" ? "" : new URLSearchParams(window.location.search).get("q")?.trim() || "");
  const [stories, setStories] = useState<Story[]>(() => {
    if (API_URL) return [];
    if (!searchQuery) return storiesData;
    const query = searchQuery.toLocaleLowerCase();
    return storiesData.filter((story) =>
      [story.title.en, story.title.bn, story.excerpt?.en, story.excerpt?.bn]
        .filter(Boolean)
        .some((value) => value?.toLocaleLowerCase().includes(query)),
    );
  });
  const [mostRead, setMostRead] = useState<Story[]>(
    API_URL ? [] : storiesData.filter((story) => MOST_READ_FALLBACK.includes(story.id)),
  );
  const [site, setSite] = useState<SiteChrome | null>(null);
  const [englishStories, setEnglishStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(Boolean(API_URL));
  const [apiError, setApiError] = useState(false);

  useEffect(() => {
    if (!API_URL) return;
    fetchSite().then(setSite).catch(() => undefined);
    const searchParam = searchQuery ? `&q=${encodeURIComponent(searchQuery)}` : "";
    Promise.all([
      fetchStories(`?limit=24${searchParam}`),
      fetchMostRead(6),
      fetchStories(`?category=english-news&limit=6`).catch(() => [] as Story[]),
    ])
      .then(([latest, popular, englishNews]) => {
        setStories(latest);
        setMostRead(popular);
        setEnglishStories(englishNews);
      })
      .catch(() => {
        setApiError(true);
        setStories(storiesData);
        setMostRead(storiesData.filter((story) => MOST_READ_FALLBACK.includes(story.id)));
      })
      .finally(() => setLoading(false));
  }, [searchQuery]);

  const heading = (key: keyof HomeHeadings) =>
    site?.settings.home_headings?.[key]?.[language] || FALLBACK_HEADINGS[key];

  const { hero, sponsor, across, more } = useMemo(() => {
    const hero = stories[0];
    const sponsor = stories.find((s) => s.sponsored) || stories.find((s) => s.id.includes("sponsor"));
    const used = new Set<string>([hero?.id, sponsor?.id].filter(Boolean) as string[]);

    const pinned = stories.filter((s) => s.featured && !used.has(s.id));
    const acrossPool = pinned.length
      ? pinned
      : stories.filter((s) => !used.has(s.id) && ACROSS_SECTIONS.includes((s.section || "").toLowerCase()));
    const across = (acrossPool.length ? acrossPool : stories.filter((s) => !used.has(s.id))).slice(0, 3);
    across.forEach((s) => used.add(s.id));

    // English-category stories have their own "In English" block below.
    const more = stories.filter((s) => !used.has(s.id) && s.section !== "english-news").slice(0, 6);
    more.forEach((s) => used.add(s.id));

    return { hero, sponsor, across, more };
  }, [stories]);

  const english = useMemo(() => {
    if (englishStories.length) return englishStories;
    const fromFeed = stories.filter((story) => story.section === "english-news" || story.category.toLowerCase().includes("english"));
    if (fromFeed.length) return fromFeed;
    return storiesData.filter((story) => story.category.toLowerCase() === "english");
  }, [englishStories, stories]);
  const liveOpinionStories = mostRead.filter((story) => story.section === "opinion" || story.category.toLowerCase() === "opinion");
  const opinionStories = liveOpinionStories.length
    ? liveOpinionStories
    : storiesData.filter((story) => story.category.toLowerCase() === "opinion");

  return (
    <>
      <TickerBanner />
      <main className="mx-auto max-w-[1080px] px-4 py-5 sm:px-6 sm:py-8">
        <h2 className="mb-3 font-serif text-lg font-bold">{heading("lead")}</h2>
        {loading && <p className="mb-3 text-sm text-slate-500">Loading latest stories…</p>}
        {apiError && <p className="mb-3 text-sm text-amber-700">Showing bundled stories while the news service is unavailable.</p>}
        {!loading && !stories.length && !apiError && <p className="mb-6 text-sm text-slate-500">No stories are available yet.</p>}
        {hero && <LeadStoryHero story={hero} onOpen={() => openStory(hero)} />}
        {sponsor && <SponsoredCard story={sponsor} onOpen={() => openStory(sponsor)} />}
        <CategoryGrid stories={across} heading={heading("across")} onOpen={openStory} />
        {site?.settings.header_banner && <AdBanner banner={site.settings.header_banner} />}
        <div className="mb-3 flex items-end justify-between">
          <h2 className="font-serif text-lg font-bold">{heading("more")}</h2>
        </div>
        <NewsGrid stories={more} onOpen={openStory} compact />

        {english.length > 0 && (
          <div className="mt-10">
            <div className="mb-3 flex items-end justify-between border-b-2 border-[#0f2f57] pb-1 dark:border-amber-400">
              <h2 className="font-serif text-lg font-bold">In English</h2>
              <button
                onClick={() => router.push("/category/english-news")}
                className="text-[10px] font-bold uppercase tracking-wider text-blue-900 hover:underline dark:text-amber-400"
              >
                All English news →
              </button>
            </div>
            <NewsGrid stories={english.slice(0, 6)} onOpen={openStory} lang="en" />
          </div>
        )}

        <div className="my-6 grid gap-3 lg:grid-cols-7">
          <div className="lg:col-span-3"><ReaderPoll /></div>
          {opinionStories.length > 0 && <div className="lg:col-span-4"><MostRead stories={opinionStories} heading={heading("opinion")} onOpen={openStory} /></div>}
        </div>
        <Newsletter />
      </main>
    </>
  );
}
