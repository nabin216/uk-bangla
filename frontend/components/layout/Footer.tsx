"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { API_URL, fetchSite } from "@/lib/api";
import type { FooterLink, SiteChrome, SocialLink } from "@/types";

const FALLBACK_EXPLORE: FooterLink[] = [
  { column: "explore", label: { en: "Home", bn: "হোম" }, url: "/" },
  { column: "explore", label: { en: "Latest News", bn: "সর্বশেষ সংবাদ" }, url: "/category/uk" },
  { column: "explore", label: { en: "Most Read", bn: "সর্বাধিক পঠিত" }, url: "/#most-read" },
];
const FALLBACK_LEGAL: FooterLink[] = [
  { column: "legal", label: { en: "Privacy", bn: "গোপনীয়তা" }, url: "/privacy" },
  { column: "legal", label: { en: "Terms", bn: "শর্তাবলি" }, url: "/privacy" },
  { column: "legal", label: { en: "Contact", bn: "যোগাযোগ" }, url: "/contact" },
];
const FALLBACK_SOCIAL: SocialLink[] = [
  { label: "X", url: "#", glyph: "𝕏" },
  { label: "Facebook", url: "#", glyph: "f" },
  { label: "Instagram", url: "#", glyph: "◎" },
  { label: "YouTube", url: "#", glyph: "▶" },
];

export default function Footer() {
  const { language, t } = useLanguage();
  const [site, setSite] = useState<SiteChrome | null>(null);

  useEffect(() => {
    if (!API_URL) return;
    let alive = true;
    fetchSite().then((data) => { if (alive) setSite(data); }).catch(() => undefined);
    return () => { alive = false; };
  }, []);

  const s = site?.settings;
  const pick = (value: { en: string; bn: string } | undefined, fallback: string) =>
    (value?.[language] || value?.en || fallback).trim() || fallback;

  const blurb = pick(s?.footer_blurb, t("footer"));
  const badge = pick(s?.footer_badge, "Independent · Accurate · Essential");
  const copyright = pick(s?.copyright, "© 2026 UK Bangla Guardian. All rights reserved.");
  const tagline = pick(s?.tagline, "News for the British-Bangladeshi community, wherever you are.");

  const masthead: { role: string; names: string[] }[] = [];
  for (const m of site?.masthead ?? []) {
    const role = m.role[language] || m.role.en;
    const name = m.name[language] || m.name.en;
    const last = masthead[masthead.length - 1];
    if (last && last.role === role) last.names.push(name);
    else masthead.push({ role, names: [name] });
  }

  const explore = site?.footer_links?.filter((l) => l.column === "explore") ?? [];
  const legal = site?.footer_links?.filter((l) => l.column === "legal") ?? [];
  const exploreLinks = explore.length ? explore : FALLBACK_EXPLORE;
  const legalLinks = legal.length ? legal : FALLBACK_LEGAL;
  const social = site?.social?.length ? site.social : FALLBACK_SOCIAL;
  const categories =
    site?.sections?.length
      ? site.sections.map((sec) => ({ label: language === "bn" ? sec.name_bn || sec.name : sec.name, url: `/category/${sec.slug}` }))
      : [
          { label: "UK News", url: "/category/uk" },
          { label: "Bangladesh Desk", url: "/category/bangladesh" },
          { label: "World Affairs", url: "/category/world" },
          { label: "Business", url: "/category/business" },
        ];

  return (
    <footer className="border-t-4 border-amber-400 bg-[#102f57] px-4 py-12 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 grid gap-x-8 gap-y-10 md:grid-cols-2 lg:grid-cols-[1.4fr_0.9fr_1.1fr_1.4fr]">
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="UK Bangla Guardian" className="h-16 w-auto rounded-md bg-white/5 p-1.5" />
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-blue-100">{blurb}</p>
            {badge && (
              <span className="mt-5 inline-block rounded-full border border-blue-300/40 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-200">
                {badge}
              </span>
            )}
            <div className="mt-5 flex flex-wrap gap-3">
              {social.map((item) => (
                <a
                  key={item.label}
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={item.label}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-blue-300/40 text-sm text-blue-100 transition hover:border-amber-300 hover:text-amber-300"
                >
                  {item.glyph}
                </a>
              ))}
            </div>
            <p className="mt-3 text-xs leading-relaxed text-blue-200">{tagline}</p>
          </div>

          <div>
            <h3 className="border-b border-blue-300/30 pb-2 text-xs font-bold uppercase tracking-widest text-amber-300">
              {language === "bn" ? "এক্সপ্লোর" : "Explore"}
            </h3>
            <ul className="mt-4 space-y-3 text-sm text-blue-100">
              {exploreLinks.map((link) => (
                <li key={`${link.url}-${link.label.en}`}>
                  <Link href={link.url} className="transition hover:text-amber-300">{link.label[language] || link.label.en}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="border-b border-blue-300/30 pb-2 text-xs font-bold uppercase tracking-widest text-amber-300">
              {language === "bn" ? "বিভাগ" : "Categories"}
            </h3>
            <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-blue-100">
              {categories.map((cat) => (
                <li key={cat.url}>
                  <Link href={cat.url} className="transition hover:text-amber-300">{cat.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {masthead.length > 0 && (
            <div>
              <h3 className="border-b border-blue-300/30 pb-2 text-xs font-bold uppercase tracking-widest text-amber-300">
                {language === "bn" ? "সম্পাদকীয় পরিষদ" : "Editorial Team"}
              </h3>
              <div className="mt-4 space-y-3 text-sm">
                {masthead.map((group) => (
                  <div key={group.role}>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-blue-300">{group.role}</div>
                    <div className="text-blue-100">{group.names.join(", ")}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col justify-between gap-3 border-t border-blue-300/30 pt-6 text-xs text-blue-200 sm:flex-row">
          <span>{copyright}</span>
          <span className="flex flex-wrap gap-x-2">
            {legalLinks.map((link, i) => (
              <span key={`${link.url}-${link.label.en}`}>
                {i > 0 && <span className="mr-2">·</span>}
                <Link href={link.url} className="transition hover:text-amber-300">{link.label[language] || link.label.en}</Link>
              </span>
            ))}
          </span>
        </div>
      </div>
    </footer>
  );
}
