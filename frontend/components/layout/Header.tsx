"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { useSavedArticles } from "@/context/SavedArticlesContext";
import { API_URL, fetchSite } from "@/lib/api";
import type { NavLink, SiteChrome } from "@/types";

type Props = { onSaved: () => void; dark: boolean; onTheme: () => void };

const FALLBACK_MENU: NavLink[] = [
  { label: { en: "Home", bn: "হোম" }, url: "/" },
  { label: { en: "UK", bn: "যুক্তরাজ্য" }, url: "/category/uk" },
  { label: { en: "Bangladesh", bn: "বাংলাদেশ" }, url: "/category/bangladesh" },
  { label: { en: "World", bn: "বিশ্ব" }, url: "/category/world" },
  { label: { en: "Business", bn: "বাণিজ্য" }, url: "/category/business" },
  { label: { en: "Culture", bn: "সংস্কৃতি" }, url: "/category/culture" },
  { label: { en: "Opinion", bn: "মতামত" }, url: "/category/opinion" },
];

export default function Header({ onSaved, dark, onTheme }: Props) {
  const { language, setLanguage, t } = useLanguage();
  const { savedArticleIds } = useSavedArticles();
  const [today, setToday] = useState("");
  const [site, setSite] = useState<SiteChrome | null>(null);

  useEffect(() => {
    const id = window.setTimeout(
      () => setToday(new Date().toLocaleDateString(language === "bn" ? "bn-BD" : "en-GB", { dateStyle: "full" })),
      0,
    );
    return () => window.clearTimeout(id);
  }, [language]);

  useEffect(() => {
    if (!API_URL) return;
    let alive = true;
    fetchSite().then((data) => { if (alive) setSite(data); }).catch(() => undefined);
    return () => { alive = false; };
  }, []);

  const menu = site?.menu?.length ? site.menu : FALLBACK_MENU;
  const settings = site?.settings;
  const rate = settings ? settings.gbp_to_bdt_rate.toFixed(2) : "152.50";
  const weather = settings ? `${settings.weather_london} · ${settings.weather_dhaka}` : "☁ London 18°C · ☀ Dhaka 31°C";

  return (
    <header className="block border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <div className="bg-slate-100 px-4 py-2 text-xs dark:bg-slate-900">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
          <span suppressHydrationWarning className="font-bold text-blue-800 dark:text-amber-400">{today}</span>
          <span>{weather} · <b className="text-emerald-700">1 GBP = ৳{rate}</b></span>
          <div className="flex items-center gap-2">
            <button onClick={() => setLanguage("en")} className={language === "en" ? "rounded-full bg-blue-800 px-2 text-white" : ""}>EN</button>
            <button onClick={() => setLanguage("bn")} className={language === "bn" ? "rounded-full bg-blue-800 px-2 text-white" : ""}>বাংলা</button>
            <button onClick={onTheme} aria-label={dark ? "Light mode" : "Dark mode"}>{dark ? "☀" : "☾"}</button>
            <button onClick={onSaved}>🔖 {t("saved")} <b className="rounded-full bg-amber-400 px-1 text-[10px] text-black">{savedArticleIds.length}</b></button>
          </div>
        </div>
      </div>
      <div className="mx-auto flex max-w-6xl items-center justify-center px-4 py-4">
        <Link href="/" aria-label="UK Bangla Guardian — home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="UK Bangla Guardian" className="h-14 w-auto sm:h-[4.5rem]" />
        </Link>
      </div>
      <nav className="overflow-x-auto border-t border-slate-200 dark:border-slate-800">
        <div className="mx-auto flex max-w-6xl justify-center gap-6 px-4 py-3 text-xs font-bold uppercase tracking-wider">
          {menu.map((item) => (
            <Link key={item.url} href={item.url} className="whitespace-nowrap hover:text-blue-700 dark:hover:text-amber-400">
              {item.label[language] || item.label.en}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
