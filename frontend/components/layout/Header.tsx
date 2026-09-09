"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { API_URL, fetchSite } from "@/lib/api";
import { bengaliDate } from "@/lib/bengaliDate";
import type { NavLink, SiteChrome } from "@/types";

type Props = { dark: boolean; onTheme: () => void };

const FALLBACK_MENU: NavLink[] = [
  { label: { en: "Home", bn: "হোম" }, url: "/" },
  { label: { en: "UK", bn: "যুক্তরাজ্য" }, url: "/category/uk" },
  { label: { en: "Bangladesh", bn: "বাংলাদেশ" }, url: "/category/bangladesh" },
  { label: { en: "World", bn: "বিশ্ব" }, url: "/category/world" },
  { label: { en: "Business", bn: "বাণিজ্য" }, url: "/category/business" },
  { label: { en: "Culture", bn: "সংস্কৃতি" }, url: "/category/culture" },
  { label: { en: "Opinion", bn: "মতামত" }, url: "/category/opinion" },
];

export default function Header({ dark, onTheme }: Props) {
  const { language, setLanguage, t } = useLanguage();
  const [dates, setDates] = useState({ en: "", bn: "" });
  const [site, setSite] = useState<SiteChrome | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => {
      const now = new Date();
      setDates({
        en: now.toLocaleDateString(language === "bn" ? "bn-BD" : "en-GB", { day: "numeric", month: "long", year: "numeric" }),
        bn: bengaliDate(now),
      });
    }, 0);
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

  const banner = settings?.header_banner;
  const bannerSrc =
    banner?.enabled && banner.image
      ? banner.image.startsWith("/") ? `${API_URL}${banner.image}` : banner.image
      : null;
  const bannerImg = bannerSrc ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={bannerSrc}
      alt={banner?.alt ?? "Advertisement"}
      className="mx-auto h-auto w-full max-w-[970px] object-contain sm:h-16 sm:w-auto lg:h-[90px]"
    />
  ) : null;

  return (
    <header className="block border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <div className="overflow-hidden bg-slate-100 py-2 text-[10px] dark:bg-slate-900 sm:text-xs">
        <div className="mx-auto flex max-w-[1080px] items-center justify-between gap-1 px-4 whitespace-nowrap sm:gap-3 sm:px-6">
          <span suppressHydrationWarning className="min-w-0 shrink truncate font-bold text-blue-800 dark:text-amber-400">
            {dates.en}
            {dates.bn && <span className="font-medium text-slate-500 dark:text-slate-400"> · {dates.bn}</span>}
          </span>
          <a href="https://www.ukbanglaguardian.com" className="hidden min-w-0 shrink truncate text-[9px] font-semibold text-blue-800 hover:underline sm:block sm:text-xs dark:text-amber-400">
            www.ukbanglaguardian.com
          </a>
          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <button onClick={() => setLanguage("en")} className={language === "en" ? "rounded-full bg-blue-800 px-2 text-white" : ""}>EN</button>
            <button onClick={() => setLanguage("bn")} className={language === "bn" ? "rounded-full bg-blue-800 px-2 text-white" : ""}>বাংলা</button>
            <button
              onClick={onTheme}
              aria-label={dark ? "Light mode" : "Dark mode"}
              className="flex h-7 min-w-7 items-center justify-center rounded-full border border-slate-300 bg-white px-1 text-base font-bold leading-none text-slate-700 shadow-sm hover:border-blue-800 hover:text-blue-800 dark:border-slate-600 dark:bg-slate-800 dark:text-amber-300 dark:hover:border-amber-400 dark:hover:text-amber-400"
            >
              {dark ? "☀" : "☾"}
            </button>
          </div>
        </div>
      </div>
      <div className="mx-auto flex max-w-[1080px] flex-col items-center gap-2 px-4 py-2 sm:flex-row sm:gap-6 sm:px-6 sm:py-3">
        <div className="flex w-full items-center justify-between sm:w-auto">
        <Link href="/" aria-label="UK Bangla Guardian — home" className="shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="UK Bangla Guardian" className="h-14 w-auto sm:h-20" />
        </Link>
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-label="Open navigation menu"
            className="flex items-center gap-2 rounded border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-blue-900 dark:border-slate-700 dark:bg-slate-900 dark:text-amber-300 sm:hidden"
          >
            <span aria-hidden="true" className="text-lg leading-none">☰</span>
            <span>Menu</span>
          </button>
        </div>
        <form action="/" method="get" className="flex w-full min-w-0 flex-1 items-center sm:max-w-sm">
          <input
            type="search"
            name="q"
            placeholder={t("search")}
            aria-label={t("search")}
            className="min-w-0 flex-1 rounded-l border border-slate-300 bg-white px-3 py-1.5 text-sm outline-none focus:border-blue-700 dark:border-slate-700 dark:bg-slate-900"
          />
          <button type="submit" aria-label="Search" className="rounded-r bg-blue-800 px-3 py-1.5 text-sm font-bold text-white hover:bg-blue-900 dark:bg-amber-400 dark:text-slate-950 dark:hover:bg-amber-300">
            🔍
          </button>
        </form>
        {bannerImg && (
          <div className="w-full min-w-0 sm:ml-auto sm:w-auto">
            {banner?.link ? (
              <a href={banner.link} target="_blank" rel="noreferrer sponsored" aria-label={banner.alt}>{bannerImg}</a>
            ) : bannerImg}
          </div>
        )}
      </div>
      <nav className="overflow-visible border-t border-slate-200 dark:border-slate-800">
        <div className="mx-auto hidden max-w-[1080px] justify-center gap-6 overflow-x-auto px-4 py-2 text-xs font-bold uppercase tracking-wider sm:flex sm:px-6">
          {menu.map((item) => (
            <Link key={item.url} href={item.url} className="whitespace-nowrap hover:text-blue-700 dark:hover:text-amber-400">
              {item.label[language] || item.label.en}
            </Link>
          ))}
        </div>
      </nav>
      <div className={`fixed inset-0 z-[60] bg-black/30 transition-opacity sm:hidden ${menuOpen ? "opacity-100" : "pointer-events-none opacity-0"}`} onClick={() => setMenuOpen(false)} />
      <aside className={`fixed right-0 top-4 z-[70] flex max-h-[calc(100vh-2rem)] w-[min(70vw,16rem)] flex-col overflow-y-auto rounded-l-xl border border-white/30 bg-white/70 p-5 shadow-2xl backdrop-blur-xl transition-transform duration-300 dark:border-slate-600/50 dark:bg-slate-900/75 sm:hidden ${menuOpen ? "translate-x-0" : "translate-x-full"}`}>
        <div className="flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-700">
          <span className="font-bold text-blue-900 dark:text-amber-300">Menu</span>
          <button type="button" onClick={() => setMenuOpen(false)} aria-label="Close navigation menu" className="rounded px-2 text-2xl leading-none text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">×</button>
        </div>
        <div className="mt-4 grid gap-1 text-sm font-bold">
          {menu.map((item) => (
            <Link
              key={item.url}
              href={item.url}
              onClick={() => setMenuOpen(false)}
              className="rounded px-3 py-3 hover:bg-slate-100 hover:text-blue-700 dark:hover:bg-slate-800 dark:hover:text-amber-400"
            >
              {item.label[language] || item.label.en}
            </Link>
          ))}
        </div>
      </aside>
    </header>
  );
}
