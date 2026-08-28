"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import StoryModal from "@/components/news/StoryModal";
import { storiesData } from "@/data/storiesData";
import { fetchStory } from "@/lib/api";
import type { Story } from "@/types";
import { LanguageProvider } from "@/context/LanguageContext";
import { SavedArticlesProvider } from "@/context/SavedArticlesContext";

export default function ArticleClient() {
  const { slug } = useParams<{ slug: string }>();
  const [story, setStory] = useState<Story | null>(storiesData.find((item) => item.id === slug) || null);
  useEffect(() => { fetchStory(slug).then(setStory).catch(() => undefined); }, [slug]);
  return <LanguageProvider><SavedArticlesProvider><><Header onSaved={() => undefined} onCategory={() => undefined} onSearch={() => undefined} dark={false} onTheme={() => undefined} />{story ? <StoryModal story={story} onClose={() => history.back()} /> : <main className="mx-auto max-w-3xl p-12">Story not found.</main>}<Footer /></></SavedArticlesProvider></LanguageProvider>;
}
