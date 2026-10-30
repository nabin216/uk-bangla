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
import type { AdPlacement, HomeHeadings, SiteChrome, SiteSection, Story } from "@/types";
import { API_URL, fetchMostRead, fetchSite, fetchStories } from "@/lib/api";

const MOST_READ_FALLBACK = ["story-6", "opinion-demo", "story-3", "story-5"];
const FALLBACK_HEADINGS: Record<keyof HomeHeadings, string> = {
  lead: "Today's essential stories",
  across: "Across Britain & Bangladesh",
  more: "More from the Guardian",
  opinion: "Most read",
};
const ACROSS_SECTIONS = ["uk", "bangladesh"];
// English-language coverage lives only in the "English News" block / category,
// never in the Bangla-edition feeds. Accept both slugs seen in the wild.
const isEnglishNews = (s: Story) => s.section === "english-news" || s.section === "english";
const ENGLISH_SLUGS = ["english-news", "english"];
// Each section gets a block of this many stories; sections with no stories are skipped.
const SECTION_BLOCK_SIZE = 4;
// A "between sections" ad goes after every this many section blocks.
const SECTIONS_PER_AD = 2;

type SectionBlock = { section: SiteSection; stories: Story[] };

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
  const [sectionBlocks, setSectionBlocks] = useState<SectionBlock[]>([]);
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

  useEffect(() => {
    if (!API_URL || searchQuery || !site?.sections?.length) return;
    let alive = true;
    const sections = site.sections.filter((sec) => !ENGLISH_SLUGS.includes(sec.slug));
    Promise.all(
      sections.map((section) =>
        // Over-fetch so the block can still fill up after dropping stories already shown higher up.
        fetchStories(`?category=${encodeURIComponent(section.slug)}&limit=${SECTION_BLOCK_SIZE * 3}`)
          .then((stories) => ({ section, stories }))
          .catch(() => ({ section, stories: [] as Story[] })),
      ),
    ).then((blocks) => {
      if (alive) setSectionBlocks(blocks.filter((block) => block.stories.length > 0));
    });
    return () => { alive = false; };
  }, [site, searchQuery]);

  const heading = (key: keyof HomeHeadings) =>
    site?.settings.home_headings?.[key]?.[language] || FALLBACK_HEADINGS[key];
  const adsFor = (placement: AdPlacement) => (site?.ads ?? []).filter((ad) => ad.placement === placement);
  const sectionAds = adsFor("home_sections");

  const { hero, sponsor, across, more } = useMemo(() => {
    // The Bangla-edition feeds never carry English-News stories.
    const feed = stories.filter((s) => !isEnglishNews(s));
    const hero = feed[0];
    const sponsor = feed.find((s) => s.sponsored) || feed.find((s) => s.id.includes("sponsor"));
    const used = new Set<string>([hero?.id, sponsor?.id].filter(Boolean) as string[]);

    const pinned = feed.filter((s) => s.featured && !used.has(s.id));
    const acrossPool = pinned.length
      ? pinned
      : feed.filter((s) => !used.has(s.id) && ACROSS_SECTIONS.includes((s.section || "").toLowerCase()));
    const across = (acrossPool.length ? acrossPool : feed.filter((s) => !used.has(s.id))).slice(0, 3);
    across.forEach((s) => used.add(s.id));

    const more = feed.filter((s) => !used.has(s.id)).slice(0, 8);
    more.forEach((s) => used.add(s.id));

    return { hero, sponsor, across, more };
  }, [stories]);

  const english = useMemo(() => {
    if (englishStories.length) return englishStories;
    const fromFeed = stories.filter(isEnglishNews);
    return fromFeed.length ? fromFeed : storiesData.filter((story) => story.category.toLowerCase() === "english");
  }, [englishStories, stories]);

  // Each story appears once on the page: section blocks skip anything already shown above them.
  const visibleBlocks = useMemo(() => {
    const shown = new Set(
      [hero, sponsor, ...across, ...more, ...english.slice(0, 6)].filter(Boolean).map((s) => (s as Story).id),
    );
    return sectionBlocks
      .map(({ section, stories: sectionStories }) => {
        const fresh = sectionStories.filter((s) => !shown.has(s.id)).slice(0, SECTION_BLOCK_SIZE);
        fresh.forEach((s) => shown.add(s.id));
        return { section, stories: fresh };
      })
      .filter((block) => block.stories.length > 0);
  }, [sectionBlocks, hero, sponsor, across, more, english]);
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
        {adsFor("home_top").map((ad, i) => <AdBanner key={`top-${i}`} banner={ad} />)}
        <CategoryGrid stories={across} heading={heading("across")} onOpen={openStory} />
        {site?.settings.header_banner && <AdBanner banner={site.settings.header_banner} />}
        <div className="mb-3 flex items-end justify-between">
          <h2 className="font-serif text-lg font-bold">{heading("more")}</h2>
        </div>
        <NewsGrid stories={more} onOpen={openStory} compact />

        {english.length > 0 && (
          <div className="mt-10">
            <div className="mb-3 flex items-end justify-between border-b-2 border-[#0f2f57] pb-1 dark:border-amber-400">
              <h2 className="font-serif text-lg font-bold">English News</h2>
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

        {visibleBlocks.map(({ section, stories: sectionStories }, i) => {
          const ad = sectionAds.length && (i + 1) % SECTIONS_PER_AD === 0
            ? sectionAds[((i + 1) / SECTIONS_PER_AD - 1) % sectionAds.length]
            : null;
          return (
            <div key={section.slug}>
              <div className="mt-10">
                <div className="mb-3 flex items-end justify-between border-b-2 border-[#0f2f57] pb-1 dark:border-amber-400">
                  <h2 className="font-serif text-lg font-bold">
                    {language === "bn" ? section.name_bn || section.name : section.name}
                  </h2>
                  <button
                    onClick={() => router.push(`/category/${section.slug}`)}
                    className="text-[10px] font-bold uppercase tracking-wider text-blue-900 hover:underline dark:text-amber-400"
                  >
                    {language === "bn" ? "সব খবর →" : "All →"}
                  </button>
                </div>
                <NewsGrid stories={sectionStories} onOpen={openStory} compact />
              </div>
              {ad && <AdBanner banner={ad} />}
            </div>
          );
        })}

        <div className="my-6 grid gap-3 lg:grid-cols-7">
          <div className="lg:col-span-3"><ReaderPoll /></div>
          {opinionStories.length > 0 && <div className="lg:col-span-4"><MostRead stories={opinionStories} heading={heading("opinion")} onOpen={openStory} /></div>}
        </div>
        {adsFor("home_bottom").map((ad, i) => <AdBanner key={`bottom-${i}`} banner={ad} />)}
        <Newsletter />
      </main>
    </>
  );
}
