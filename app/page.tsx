"use client";
import { useMemo, useState } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import TickerBanner from "@/components/news/TickerBanner";
import CategoryBanner from "@/components/news/CategoryBanner";
import LeadStoryHero from "@/components/news/LeadStoryHero";
import CategoryGrid from "@/components/news/CategoryGrid";
import NewsGrid from "@/components/news/NewsGrid";
import SponsoredCard from "@/components/news/SponsoredCard";
import MostRead from "@/components/news/MostRead";
import StoryModal from "@/components/news/StoryModal";
import RemittanceCalc from "@/components/widgets/RemittanceCalc";
import ReaderPoll from "@/components/widgets/ReaderPoll";
import Newsletter from "@/components/widgets/Newsletter";
import SavedArticlesModal from "@/components/modals/SavedArticlesModal";
import { storiesData } from "@/data/storiesData";
import { LanguageProvider } from "@/context/LanguageContext";
import { SavedArticlesProvider } from "@/context/SavedArticlesContext";
import { useLanguage } from "@/context/LanguageContext";
import type { Story } from "@/types";

function GuardianPage() { const { language } = useLanguage(); const [category, setCategory] = useState("All"); const [query, setQuery] = useState(""); const [savedOpen, setSavedOpen] = useState(false); const [activeStory, setActiveStory] = useState<Story | null>(null); const [dark, setDark] = useState(() => typeof window !== "undefined" && window.localStorage.getItem("uk-bangla-theme") === "dark"); const toggleTheme = () => { setDark((current) => { const next = !current; document.documentElement.classList.toggle("dark", next); window.localStorage.setItem("uk-bangla-theme", next ? "dark" : "light"); return next; }); }; const visible = useMemo(() => storiesData.filter((story) => (category === "All" || story.category.toLowerCase().includes(category.toLowerCase())) && (!query || `${story.title.en} ${story.title.bn}`.toLowerCase().includes(query.toLowerCase()))), [category, query]); const hero = storiesData[0]; const mostRead = storiesData.filter((story) => ["story-6", "story-3", "story-5"].includes(story.id)); const sponsor = storiesData.find((s) => s.id === "story-sponsor")!; return <div className={`${dark ? "dark" : ""} ${language === "bn" ? "font-bengali" : ""}`}><button onClick={toggleTheme} aria-label={dark ? "Switch to light mode" : "Switch to dark mode"} className="fixed right-3 top-3 z-40 rounded-full border border-slate-300 bg-white px-2 py-1 text-xs shadow sm:hidden dark:border-slate-700 dark:bg-slate-800">{dark ? "☀" : "☾"}</button><div className="min-h-screen bg-[#f3f3f0] font-sans text-slate-900 dark:bg-slate-950 dark:text-slate-100"><Header onSaved={() => setSavedOpen(true)} onCategory={setCategory} onSearch={setQuery} dark={dark} onTheme={toggleTheme} /><TickerBanner /><main className="mx-auto max-w-[1080px] px-4 py-5 sm:px-6 sm:py-8"><h2 className="mb-3 font-serif text-lg font-bold">Today&apos;s essential stories</h2><CategoryBanner category={category} onReset={() => setCategory("All")} /><LeadStoryHero story={hero} onOpen={() => setActiveStory(hero)} /><SponsoredCard story={sponsor} onOpen={() => setActiveStory(sponsor)} /><CategoryGrid stories={storiesData} onOpen={setActiveStory} /><RemittanceCalc /><div className="mb-3 flex items-end justify-between"><h2 className="font-serif text-lg font-bold">More from the Guardian</h2></div><NewsGrid stories={visible} onOpen={setActiveStory} /><div className="my-6 grid gap-3 lg:grid-cols-7"><div className="lg:col-span-3"><ReaderPoll /></div><div className="lg:col-span-4"><MostRead stories={mostRead} onOpen={setActiveStory} /></div></div><Newsletter /></main><Footer /><StoryModal story={activeStory} onClose={() => setActiveStory(null)} /><SavedArticlesModal open={savedOpen} onClose={() => setSavedOpen(false)} stories={storiesData} onOpen={setActiveStory} /></div></div>; }
export default function Home() { return <LanguageProvider><SavedArticlesProvider><GuardianPage /></SavedArticlesProvider></LanguageProvider>; }
