"use client";
import { useState } from "react";
import SectionHeading from "@/components/news/SectionHeading";
import NewsGrid from "@/components/news/NewsGrid";
import { useLanguage } from "@/context/LanguageContext";
import type { SiteSection, Story } from "@/types";

const PAGE_SIZE = 8;

export type MoreStoriesTab = { section: SiteSection; stories: Story[] };

// "Read more" block: category tabs over a card grid, with a button that reveals further rows.
export default function MoreStories({
  all,
  tabs,
  onOpen,
}: {
  all: Story[];
  tabs: MoreStoriesTab[];
  onOpen: (story: Story) => void;
}) {
  const { language, t } = useLanguage();
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const [visible, setVisible] = useState(PAGE_SIZE);

  const activeTab = tabs.find((tab) => tab.section.slug === activeSlug);
  const stories = activeTab ? activeTab.stories : all;
  if (!all.length && !tabs.length) return null;

  const select = (slug: string | null) => {
    setActiveSlug(slug);
    setVisible(PAGE_SIZE);
  };
  const tabClass = (active: boolean) =>
    `shrink-0 whitespace-nowrap rounded-md px-4 py-1.5 text-sm font-semibold transition ${
      active
        ? "bg-brand text-white dark:bg-amber-400 dark:text-slate-950"
        : "text-slate-700 hover:text-accent dark:text-slate-300 dark:hover:text-amber-400"
    }`;

  return (
    <section className="mb-10">
      <SectionHeading
        title={t("readMore")}
        href={activeTab ? `/category/${activeTab.section.slug}` : undefined}
        moreLabel={t("viewAllNews")}
      />
      {tabs.length > 0 && (
        <div
          role="tablist"
          className="mb-6 flex items-center gap-1 overflow-x-auto border-b border-slate-200 pb-4 [scrollbar-width:none] dark:border-slate-800 [&::-webkit-scrollbar]:hidden"
        >
          <button type="button" role="tab" aria-selected={!activeTab} onClick={() => select(null)} className={tabClass(!activeTab)}>
            {t("allNews")}
          </button>
          {tabs.map(({ section }) => {
            const active = section.slug === activeSlug;
            return (
              <span key={section.slug} className="flex shrink-0 items-center gap-1">
                <span aria-hidden className="h-5 w-px bg-slate-300 dark:bg-slate-700" />
                <button type="button" role="tab" aria-selected={active} onClick={() => select(section.slug)} className={tabClass(active)}>
                  {language === "bn" ? section.name_bn || section.name : section.name}
                </button>
              </span>
            );
          })}
        </div>
      )}
      <NewsGrid stories={stories.slice(0, visible)} onOpen={onOpen} compact />
      {stories.length > visible && (
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
    </section>
  );
}
