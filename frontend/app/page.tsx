"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import TickerBanner from "@/components/news/TickerBanner";
import LeadStoryHero from "@/components/news/LeadStoryHero";
import LatestList from "@/components/news/LatestList";
import SectionHeading from "@/components/news/SectionHeading";
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
// English-language coverage lives only in the "English News" block / category,
// never in the Bangla-edition feeds. Accept both slugs seen in the wild.
const isEnglishNews = (s: Story) => s.section === "english-news" || s.section === "english";
const ENGLISH_SLUGS = ["english-news", "english"];
// Each section shows one row of cards; sections with no stories are skipped.
const SECTION_BLOCK_SIZE = 3;
// A "between sections" ad goes after every this many sections.
const SECTIONS_PER_AD = 3;
const LATEST_COUNT = 5;

type SectionStories = { section: SiteSection; stories: Story[] };

export default function Home() {
  const router = useRouter();
  const { language, t } = useLanguage();
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
  const [sectionBlocks, setSectionBlocks] = useState<SectionStories[]>([]);
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

  const { feed, hero, sponsor, latest } = useMemo(() => {
    // The Bangla-edition feeds never carry English-News stories.
    const feed = stories.filter((s) => !isEnglishNews(s));
    const hero = feed[0];
    const sponsor = feed.find((s) => s.sponsored) || feed.find((s) => s.id.includes("sponsor"));
    const latest = feed.filter((s) => s.id !== hero?.id && s.id !== sponsor?.id).slice(0, LATEST_COUNT);
    return { feed, hero, sponsor, latest };
  }, [stories]);

  const english = useMemo(() => {
    if (englishStories.length) return englishStories;
    const fromFeed = stories.filter(isEnglishNews);
    return fromFeed.length ? fromFeed : storiesData.filter((story) => story.category.toLowerCase() === "english");
  }, [englishStories, stories]);

  // Section blocks never repeat the lead story, the sponsored story or each other.
  const blockRows = useMemo(() => {
    const shown = new Set([hero, sponsor].filter(Boolean).map((s) => (s as Story).id));
    const blocks = sectionBlocks
      .map(({ section, stories: sectionStories }) => {
        const fresh = sectionStories.filter((s) => !shown.has(s.id)).slice(0, SECTION_BLOCK_SIZE);
        fresh.forEach((s) => shown.add(s.id));
        return { section, stories: fresh };
      })
      .filter((block) => block.stories.length > 0);
    const rows: SectionStories[][] = [];
    for (let i = 0; i < blocks.length; i += SECTIONS_PER_AD) rows.push(blocks.slice(i, i + SECTIONS_PER_AD));
    return rows;
  }, [sectionBlocks, hero, sponsor]);

  const liveOpinionStories = mostRead.filter((story) => story.section === "opinion" || story.category.toLowerCase() === "opinion");
  // Prefer the opinion section's own latest stories; fall back to most-read opinion, then bundled samples.
  const opinionSection = sectionBlocks.find((block) => block.section.slug === "opinion");
  const opinionStories = opinionSection?.stories.length
    ? opinionSection.stories
    : liveOpinionStories.length
      ? liveOpinionStories
      : storiesData.filter((story) => story.category.toLowerCase() === "opinion");

  const cmsTicker = (site?.ticker ?? []).map((item) => item[language] || item.en).filter(Boolean);
  const tickerItems = cmsTicker.length ? cmsTicker : feed.slice(0, 5).map((s) => s.title[language]);
  const showSearchResults = Boolean(searchQuery) && !loading;
  // Without live section data (no API, or it is down) the rest of the feed fills the page instead.
  const feedFallback = !API_URL || apiError ? feed.filter((s) => s.id !== hero?.id && s.id !== sponsor?.id) : [];

  return (
    <>
      <TickerBanner items={tickerItems} />
      <div className="bg-paper dark:bg-slate-950">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
          {loading && <p className="mb-3 text-sm text-slate-500">Loading latest stories…</p>}
          {apiError && <p className="mb-3 text-sm text-amber-700">Showing bundled stories while the news service is unavailable.</p>}
          {!loading && !stories.length && !apiError && <p className="mb-6 text-sm text-slate-500">No stories are available yet.</p>}
          {showSearchResults ? (
            <>
              <SectionHeading title={`“${searchQuery}”`} />
              <NewsGrid stories={stories} onOpen={openStory} />
            </>
          ) : (
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-7">
              <div className="min-w-0">
                <SectionHeading title={heading("lead")} />
                {hero && <LeadStoryHero story={hero} />}
              </div>
              <div className="min-w-0 lg:border-l lg:border-slate-300 lg:pl-7 dark:lg:border-slate-800">
                <LatestList stories={latest} />
              </div>
            </div>
          )}
        </div>
      </div>

      <main className="border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          {!showSearchResults && (
            <>
              {adsFor("home_top").map((ad, i) => <AdBanner key={`top-${i}`} banner={ad} />)}
              {sponsor && <SponsoredCard story={sponsor} onOpen={() => openStory(sponsor)} />}

              {blockRows.map((row, rowIndex) => {
                const ad = sectionAds.length && row.length === SECTIONS_PER_AD
                  ? sectionAds[rowIndex % sectionAds.length]
                  : null;
                return (
                  <div key={row[0].section.slug}>
                    {row.map(({ section, stories: sectionStories }) => (
                      <section key={section.slug} className="mb-10">
                        <SectionHeading
                          title={language === "bn" ? section.name_bn || section.name : section.name}
                          href={`/category/${section.slug}`}
                          moreLabel={t("readMore")}
                        />
                        <NewsGrid stories={sectionStories} onOpen={openStory} />
                      </section>
                    ))}
                    {ad && <AdBanner banner={ad} />}
                  </div>
                );
              })}

              {feedFallback.length > 0 && (
                <div className="mb-10">
                  <SectionHeading title={heading("more")} />
                  <NewsGrid stories={feedFallback.slice(0, 8)} onOpen={openStory} compact />
                </div>
              )}

              {english.length > 0 && (
                <div className="mb-10">
                  <SectionHeading title="English News" href="/category/english-news" moreLabel="All English news" />
                  <NewsGrid stories={english.slice(0, 6)} onOpen={openStory} lang="en" />
                </div>
              )}
            </>
          )}

          <div className="my-6 grid gap-5 lg:grid-cols-5">
            <div className="lg:col-span-2"><ReaderPoll /></div>
            {opinionStories.length > 0 && (
              <div className="lg:col-span-3">
                <MostRead
                  stories={opinionStories}
                  heading={heading("opinion")}
                  onOpen={openStory}
                  href={opinionSection ? "/category/opinion" : undefined}
                  moreLabel={t("allOpinion")}
                />
              </div>
            )}
          </div>
          {adsFor("home_bottom").map((ad, i) => <AdBanner key={`bottom-${i}`} banner={ad} />)}
          <Newsletter />
        </div>
      </main>
    </>
  );
}
