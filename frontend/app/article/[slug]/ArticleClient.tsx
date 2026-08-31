"use client";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import ArticleReader from "@/components/news/ArticleReader";
import { storiesData } from "@/data/storiesData";
import { API_URL, fetchStory, fetchStories } from "@/lib/api";
import type { Story } from "@/types";
import { useLanguage } from "@/context/LanguageContext";

function pickRelated(all: Story[], current: Story) {
  const others = all.filter((item) => item.id !== current.id);
  const sameCategory = others.filter((item) => item.category.toLowerCase() === current.category.toLowerCase());
  return [...sameCategory, ...others.filter((item) => !sameCategory.includes(item))].slice(0, 3);
}

export default function ArticleClient() {
  const { slug } = useParams<{ slug: string }>();
  const { t } = useLanguage();
  const [story, setStory] = useState<Story | null>(API_URL ? null : storiesData.find((item) => item.id === slug) || null);
  const [pool, setPool] = useState<Story[]>(API_URL ? [] : storiesData);
  const [loading, setLoading] = useState(Boolean(API_URL));
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!API_URL) return;
    const timer = window.setTimeout(() => setLoading(true), 0);
    Promise.all([fetchStory(slug), fetchStories("?limit=50").catch(() => [] as Story[])])
      .then(([detail, latest]) => {
        setStory(detail);
        setPool(latest.length ? latest : storiesData);
      })
      .catch(() => {
        setError(true);
        setStory(storiesData.find((item) => item.id === slug) || null);
        setPool(storiesData);
      })
      .finally(() => {
        window.clearTimeout(timer);
        setLoading(false);
      });
    return () => window.clearTimeout(timer);
  }, [slug]);

  const related = useMemo(() => (story ? pickRelated(pool, story) : []), [pool, story]);

  if (loading) return <main className="mx-auto max-w-3xl p-16 text-sm text-slate-500">{t("storyLoading")}</main>;
  if (!story) {
    return (
      <main className="mx-auto max-w-3xl p-16 text-sm text-slate-500">
        {error ? t("storyUnavailable") : t("storyMissing")}
      </main>
    );
  }

  return (
    <>
      <ArticleReader story={story} related={related} />
      {error && (
        <p className="fixed bottom-4 left-1/2 z-[60] -translate-x-1/2 rounded bg-amber-100 px-4 py-2 text-sm text-amber-900">
          {t("serviceDown")}
        </p>
      )}
    </>
  );
}
