"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { API_URL, decodeSlug, fetchSite } from "@/lib/api";
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

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={`fill-none stroke-current stroke-2 ${className ?? "h-4 w-4"}`}>
      <circle cx="11" cy="11" r="7" />
      <path strokeLinecap="round" d="m20 20-3.5-3.5" />
    </svg>
  );
}

function ThemeIcon({ dark }: { dark: boolean }) {
  return dark ? (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-2">
      <circle cx="12" cy="12" r="4" />
      <path strokeLinecap="round" d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  ) : (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-current">
      <path d="M20.4 14.5A8.5 8.5 0 0 1 9.5 3.6a.75.75 0 0 0-.98-.9A9.75 9.75 0 1 0 21.3 15.48a.75.75 0 0 0-.9-.98Z" />
    </svg>
  );
}

export default function Header({ dark, onTheme }: Props) {
  const { language, setLanguage, t } = useLanguage();
  const pathname = usePathname();
  const searchRef = useRef<HTMLInputElement>(null);
  const [dates, setDates] = useState({ en: "", day: "", bn: "" });
  const [site, setSite] = useState<SiteChrome | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => {
      const now = new Date();
      const locale = language === "bn" ? "bn-BD" : "en-GB";
      setDates({
        en: now.toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" }),
        day: now.toLocaleDateString(locale, { weekday: "long" }),
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
  const sections: NavLink[] = (site?.sections ?? []).map((sec) => ({
    label: { en: sec.name, bn: sec.name_bn || sec.name },
    url: `/category/${sec.slug}`,
  }));
  const menuUrls = new Set(menu.map((item) => item.url));
  const extraSections = sections.filter((sec) => !menuUrls.has(sec.url));
  const moreLabel = t("more");
  // Items 0..BAR_SM-1 always sit in the bar; BAR_SM..BAR_LG-1 only on wide screens; the rest live under "More".
  const BAR_SM = 5;
  const BAR_LG = 8;
  const overflowMenu = menu.slice(BAR_SM);
  const moreOnlyBelowLg = menu.length <= BAR_LG && extraSections.length === 0;
  const currentPath = decodeSlug(pathname || "/");
  const isActive = (url: string) => (url === "/" ? currentPath === "/" : currentPath === decodeSlug(url));
  // Inner pages get a single-row header: logo + menu, with search behind the top-bar icon.
  const compact = currentPath !== "/";

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
      className="mx-auto h-auto w-full max-w-[970px] object-contain sm:h-20 sm:w-auto lg:h-24"
    />
  ) : null;

  const langButton = (code: "bn" | "en", label: string) => (
    <button
      type="button"
      onClick={() => setLanguage(code)}
      aria-pressed={language === code}
      className={language === code ? "rounded-full bg-white px-3 py-0.5 font-bold text-brand" : "px-1 font-semibold hover:underline"}
    >
      {label}
    </button>
  );
  const divider = <span aria-hidden className="h-4 w-px bg-white/40" />;

  const logo = (size: string) => (
    <Link href="/" aria-label="UK Bangla Guardian — home" className="shrink-0">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo.png" alt="UK Bangla Guardian" className={size} />
    </Link>
  );
  const menuButton = (
    <button
      type="button"
      onClick={() => setMenuOpen((open) => !open)}
      aria-expanded={menuOpen}
      aria-label="Open navigation menu"
      className="flex items-center gap-2 rounded border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-brand dark:border-slate-700 dark:bg-slate-900 dark:text-amber-300 sm:hidden"
    >
      <span aria-hidden="true" className="text-lg leading-none">☰</span>
      <span>{t("menu")}</span>
    </button>
  );
  const searchForm = (width: string, autoFocus: boolean) => (
    <form action="/" method="get" className={`flex w-full min-w-0 flex-1 items-center ${width}`}>
      <input
        ref={searchRef}
        type="search"
        name="q"
        autoFocus={autoFocus}
        placeholder={t("search")}
        aria-label={t("search")}
        className="min-w-0 flex-1 rounded-l-md border border-r-0 border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand dark:border-slate-700 dark:bg-slate-900 dark:focus:border-amber-400"
      />
      <button
        type="submit"
        aria-label={t("search")}
        className="flex items-center justify-center self-stretch rounded-r-md bg-brand px-4 text-white hover:bg-brand-dark dark:bg-amber-400 dark:text-slate-950 dark:hover:bg-amber-300"
      >
        <SearchIcon className="h-5 w-5" />
      </button>
    </form>
  );
  const navItems = (
    <>
      {menu.slice(0, BAR_LG).map((item, i) => (
        <Link
          key={item.url}
          href={item.url}
          aria-current={isActive(item.url) ? "page" : undefined}
          className={`-mb-px whitespace-nowrap border-b-[3px] py-2.5 hover:text-brand dark:hover:text-amber-400 ${
            isActive(item.url) ? "border-accent text-brand dark:border-amber-400 dark:text-amber-400" : "border-transparent"
          } ${i >= BAR_SM ? "hidden lg:inline" : ""}`}
        >
          {item.label[language] || item.label.en}
        </Link>
      ))}
      {(overflowMenu.length > 0 || extraSections.length > 0) && (
        <div className={`relative ${moreOnlyBelowLg ? "lg:hidden" : ""}`}>
          <button
            type="button"
            onClick={() => setMoreOpen((open) => !open)}
            aria-expanded={moreOpen}
            className="whitespace-nowrap py-2.5 hover:text-brand dark:hover:text-amber-400"
          >
            {moreLabel} <span className="text-xs">{moreOpen ? "▴" : "▾"}</span>
          </button>
          {moreOpen && (
            <div className="absolute right-0 top-full z-50 flex max-h-[70vh] min-w-48 flex-col overflow-y-auto rounded-md border border-slate-200 bg-white py-1 text-sm shadow-lg dark:border-slate-700 dark:bg-slate-900">
              {[...overflowMenu, ...extraSections].map((item, i) => (
                <Link
                  key={item.url}
                  href={item.url}
                  onClick={() => setMoreOpen(false)}
                  className={`whitespace-nowrap px-4 py-2 hover:bg-slate-100 hover:text-brand dark:hover:bg-slate-800 dark:hover:text-amber-400 ${i < BAR_LG - BAR_SM && i < overflowMenu.length ? "lg:hidden" : ""}`}
                >
                  {item.label[language] || item.label.en}
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );

  return (
    <header className="block bg-white dark:bg-slate-950">
      <div className="bg-brand text-xs text-white dark:bg-slate-900 sm:text-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 whitespace-nowrap px-4 py-2 sm:px-6">
          <span suppressHydrationWarning className="min-w-0 shrink truncate font-medium">
            {dates.en}
            {dates.day && ` · ${dates.day}`}
            {dates.bn && ` · ${dates.bn}`}
          </span>
          <a href="https://www.ukbanglaguardian.com" className="hidden shrink-0 font-semibold hover:underline md:block">
            www.ukbanglaguardian.com
          </a>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            {langButton("bn", "বাংলা")}
            {divider}
            {langButton("en", "EN")}
            {divider}
            <button
              type="button"
              onClick={onTheme}
              aria-label={dark ? "Light mode" : "Dark mode"}
              className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-white/15"
            >
              <ThemeIcon dark={dark} />
            </button>
            {divider}
            <button
              type="button"
              onClick={() => (compact ? setSearchOpen((open) => !open) : searchRef.current?.focus())}
              aria-label={t("search")}
              className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-white/15"
            >
              <SearchIcon />
            </button>
          </div>
        </div>
      </div>
      {compact ? (
        <>
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="flex items-center justify-between gap-5 border-b border-brand/50 py-2.5 dark:border-slate-800 lg:gap-7">
              {logo("h-14 w-auto sm:h-16 lg:h-20")}
              {menuButton}
              <span aria-hidden className="hidden h-12 w-px shrink-0 bg-slate-300 dark:bg-slate-700 sm:block" />
              <nav className="hidden min-w-0 flex-1 items-center justify-between gap-4 text-[15px] font-semibold sm:flex">
                {navItems}
              </nav>
            </div>
          </div>
          {searchOpen && (
            <div className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
              <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6">{searchForm("sm:max-w-xl", true)}</div>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 py-3 sm:flex-row sm:gap-8 sm:px-6 sm:py-4">
            <div className="flex w-full items-center justify-between sm:w-auto">
              {logo("h-14 w-auto sm:h-24")}
              {menuButton}
            </div>
            {searchForm("sm:max-w-md", false)}
            {bannerImg && (
              <div className="flex w-full min-w-0 items-center gap-4 sm:ml-auto sm:w-auto sm:border-l sm:border-slate-300 sm:pl-6 dark:sm:border-slate-700">
                <span className="hidden border-b border-slate-400 pb-0.5 text-xs font-medium text-slate-600 dark:text-slate-400 lg:block">
                  {t("advertisement")}
                </span>
                {banner?.link ? (
                  <a href={banner.link} target="_blank" rel="noreferrer sponsored" aria-label={banner.alt} className="min-w-0 flex-1">{bannerImg}</a>
                ) : bannerImg}
              </div>
            )}
          </div>
          <nav className="mx-auto hidden max-w-6xl px-4 sm:block sm:px-6">
            <div className="flex items-center justify-center gap-7 border-y border-slate-300 text-[15px] font-semibold dark:border-slate-800 lg:gap-9">
              {navItems}
            </div>
          </nav>
        </>
      )}
      <div className={`fixed inset-0 z-[60] bg-black/30 transition-opacity sm:hidden ${menuOpen ? "opacity-100" : "pointer-events-none opacity-0"}`} onClick={() => setMenuOpen(false)} />
      <aside className={`fixed right-0 top-4 z-[70] flex max-h-[calc(100vh-2rem)] w-[min(70vw,16rem)] flex-col overflow-y-auto rounded-l-xl border border-white/30 bg-white/70 p-5 shadow-2xl backdrop-blur-xl transition-transform duration-300 dark:border-slate-600/50 dark:bg-slate-900/75 sm:hidden ${menuOpen ? "translate-x-0" : "translate-x-full"}`}>
        <div className="flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-700">
          <span className="font-bold text-brand dark:text-amber-300">{t("menu")}</span>
          <button type="button" onClick={() => setMenuOpen(false)} aria-label="Close navigation menu" className="rounded px-2 text-2xl leading-none text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">×</button>
        </div>
        <div className="mt-4 grid gap-1 text-sm font-bold">
          {menu.map((item) => (
            <Link
              key={item.url}
              href={item.url}
              onClick={() => setMenuOpen(false)}
              className="rounded px-3 py-3 hover:bg-slate-100 hover:text-brand dark:hover:bg-slate-800 dark:hover:text-amber-400"
            >
              {item.label[language] || item.label.en}
            </Link>
          ))}
          {extraSections.length > 0 && (
            <>
              <span className="mt-3 border-t border-slate-200 px-3 pt-3 text-xs uppercase tracking-wider text-slate-500 dark:border-slate-700 dark:text-slate-400">{moreLabel}</span>
              {extraSections.map((item) => (
                <Link
                  key={item.url}
                  href={item.url}
                  onClick={() => setMenuOpen(false)}
                  className="rounded px-3 py-3 hover:bg-slate-100 hover:text-brand dark:hover:bg-slate-800 dark:hover:text-amber-400"
                >
                  {item.label[language] || item.label.en}
                </Link>
              ))}
            </>
          )}
        </div>
      </aside>
    </header>
  );
}
