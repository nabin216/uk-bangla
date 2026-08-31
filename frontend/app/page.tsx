"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import TickerBanner from "@/components/news/TickerBanner";
import LeadStoryHero from "@/components/news/LeadStoryHero";
import CategoryGrid from "@/components/news/CategoryGrid";
import NewsGrid from "@/components/news/NewsGrid";
import SponsoredCard from "@/components/news/SponsoredCard";
import MostRead from "@/components/news/MostRead";
import RemittanceCalc from "@/components/widgets/RemittanceCalc";
import ReaderPoll from "@/components/widgets/ReaderPoll";
import Newsletter from "@/components/widgets/Newsletter";
import { storiesData } from "@/data/storiesData";
import { useLanguage } from "@/context/LanguageContext";
import type { HomeHeadings, SiteChrome, Story } from "@/types";
import { API_URL, fetchMostRead, fetchSite, fetchStories } from "@/lib/api";

const MOST_READ_FALLBACK = ["story-6", "story-3", "story-5"];
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
  const [stories, setStories] = useState<Story[]>(API_URL ? [] : storiesData);
  const [mostRead, setMostRead] = useState<Story[]>(
    API_URL ? [] : storiesData.filter((story) => MOST_READ_FALLBACK.includes(story.id)),
  );
  const [site, setSite] = useState<SiteChrome | null>(null);
  const [loading, setLoading] = useState(Boolean(API_URL));
  const [apiError, setApiError] = useState(false);

  useEffect(() => {
    if (!API_URL) return;
    fetchSite().then(setSite).catch(() => undefined);
    Promise.all([fetchStories("?limit=50"), fetchMostRead()])
      .then(([latest, popular]) => {
        setStories(latest);
        setMostRead(popular);
      })
      .catch(() => {
        setApiError(true);
        setStories(storiesData);
        setMostRead(storiesData.filter((story) => MOST_READ_FALLBACK.includes(story.id)));
      })
      .finally(() => setLoading(false));
  }, []);

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

    const more = stories.filter((s) => !used.has(s.id)).slice(0, 6);
    return { hero, sponsor, across, more };
  }, [stories]);

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
        <RemittanceCalc />
        <div className="mb-3 flex items-end justify-between">
          <h2 className="font-serif text-lg font-bold">{heading("more")}</h2>
        </div>
        <NewsGrid stories={more} onOpen={openStory} />
        <div className="my-6 grid gap-3 lg:grid-cols-7">
          <div className="lg:col-span-3"><ReaderPoll /></div>
          <div className="lg:col-span-4"><MostRead stories={mostRead} heading={heading("opinion")} onOpen={openStory} /></div>
        </div>
        <Newsletter />
      </main>
    </>
  );
}
