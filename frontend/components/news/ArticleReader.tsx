"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { Story } from "@/types";
import { useLanguage } from "@/context/LanguageContext";
import { useSavedArticles } from "@/context/SavedArticlesContext";
import CommentSection from "@/components/news/CommentSection";

const BLOCK_RE = /<(p|h[1-6]|ul|ol|blockquote|figure|div|section)\b/i;

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function buildBodyHtml(raw: string) {
  const text = (raw || "").trim();
  if (!text) return "";
  if (BLOCK_RE.test(text)) return text;
  return text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => `<p>${escapeHtml(line)}</p>`)
    .join("");
}

function plainText(html: string) {
  if (typeof window === "undefined") return html.replace(/<[^>]+>/g, " ");
  return new DOMParser().parseFromString(html, "text/html").body.textContent || "";
}

function hostname(url?: string) {
  if (!url) return "";
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

export default function ArticleReader({ story, related }: { story: Story; related: Story[] }) {
  const { language, t } = useLanguage();
  const { savedArticleIds, toggleSavedArticle } = useSavedArticles();
  const [progress, setProgress] = useState(0);
  const [speaking, setSpeaking] = useState(false);
  const [copied, setCopied] = useState(false);
  const [url, setUrl] = useState("");
  const bodyRef = useRef<HTMLDivElement>(null);

  const saved = savedArticleIds.includes(story.id);
  const bodyHtml = useMemo(() => buildBodyHtml(story.body[language] || story.excerpt?.[language] || ""), [story, language]);
  const minutes = useMemo(() => {
    if (story.readMinutes) return story.readMinutes;
    const words = plainText(`${story.title[language]} ${bodyHtml}`).trim().split(/\s+/).filter(Boolean).length;
    return Math.max(3, Math.round(words / 200));
  }, [bodyHtml, story, language]);

  const authorRaw = language === "bn" ? story.authorBn || story.author : story.author;
  const match = authorRaw.match(/^(.*?)\s*\((.+)\)\s*$/);
  const authorName = match ? match[1].trim() : authorRaw;
  const authorRole = story.authorRole?.[language] || (match ? match[2].trim() : t("staffReporter"));
  const initials = authorName.split(/\s+/).map((part) => part[0]).slice(0, 2).join("").toUpperCase();
  const categoryLabel = language === "bn" ? story.categoryBn || story.category : story.category;
  const sectionLabel = (story.section || "").replace(/-/g, " ");
  const caption = story.imageCaption?.[language] || "";
  const credit = story.imageCredit || hostname(story.sourceUrl) || "UK Bangla Guardian";
  const pullQuote = story.pullQuote?.[language] || "";

  useEffect(() => {
    const urlTimer = window.setTimeout(() => setUrl(window.location.href), 0);
    let frame = 0;
    const update = () => {
      frame = 0;
      const el = bodyRef.current;
      if (!el) return;
      const start = el.offsetTop;
      const span = el.offsetHeight - window.innerHeight * 0.5;
      const scrolled = window.scrollY - start;
      setProgress(Math.min(100, Math.max(0, span > 0 ? (scrolled / span) * 100 : 0)));
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    frame = window.requestAnimationFrame(update);
    return () => {
      window.clearTimeout(urlTimer);
      window.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [story.id]);

  useEffect(() => () => window.speechSynthesis?.cancel(), []);

  const speak = () => {
    if (!("speechSynthesis" in window)) return;
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(`${story.title[language]}. ${plainText(bodyHtml)}`);
    utterance.lang = language === "bn" ? "bn-BD" : "en-GB";
    utterance.onend = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
    setSpeaking(true);
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url || window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  const encoded = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(story.title[language]);
  const shareLinks = [
    { label: "Facebook", glyph: "f", href: `https://www.facebook.com/sharer/sharer.php?u=${encoded}` },
    { label: "X", glyph: "𝕏", href: `https://twitter.com/intent/tweet?url=${encoded}&text=${encodedTitle}` },
    { label: "WhatsApp", glyph: "⌾", href: `https://wa.me/?text=${encodedTitle}%20${encoded}` },
  ];

  const shareButtons = (
    <>
      <button
        onClick={copyLink}
        aria-label={t("copyLink")}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 text-xs transition hover:border-[#0f2f57] hover:text-[#0f2f57] dark:border-slate-700 dark:hover:border-amber-400 dark:hover:text-amber-400"
      >
        {copied ? "✓" : "🔗"}
      </button>
      {shareLinks.map((link) => (
        <a
          key={link.label}
          href={link.href}
          target="_blank"
          rel="noreferrer"
          aria-label={`${t("share")} — ${link.label}`}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 text-xs transition hover:border-[#0f2f57] hover:text-[#0f2f57] dark:border-slate-700 dark:hover:border-amber-400 dark:hover:text-amber-400"
        >
          {link.glyph}
        </a>
      ))}
    </>
  );

  return (
    <main className="bg-[#f4f2ec] pb-4 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="fixed inset-x-0 top-0 z-40 h-1 bg-transparent">
        <div className="h-full bg-amber-500 transition-[width] duration-150 ease-out" style={{ width: `${progress}%` }} />
      </div>

      <div className="mx-auto max-w-[1140px] px-4 pt-8 sm:px-6">
        <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
          <Link href="/" className="transition hover:text-[#0f2f57] dark:hover:text-amber-400">
            ← {t("backToHome")}
          </Link>
          <span className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <span className="h-2 w-2 animate-pulse rounded-full bg-red-600 dark:bg-red-400" />
            {t("liveReporting")}
          </span>
        </div>

        <div className="mx-auto mt-8 flex max-w-[720px] gap-8 lg:max-w-[788px]">
          <aside className="hidden w-10 shrink-0 lg:block">
            <div className="sticky top-24 flex flex-col items-center gap-3">
              <span className="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">{t("share")}</span>
              {shareButtons}
              <button
                onClick={() => toggleSavedArticle(story.id)}
                aria-pressed={saved}
                aria-label={t("save")}
                className={`flex h-9 w-9 items-center justify-center rounded-full border text-xs transition ${
                  saved
                    ? "border-amber-500 bg-amber-500 text-white"
                    : "border-slate-300 hover:border-[#0f2f57] hover:text-[#0f2f57] dark:border-slate-700 dark:hover:border-amber-400 dark:hover:text-amber-400"
                }`}
              >
                {saved ? "🔖" : "♡"}
              </button>
            </div>
          </aside>

          <article className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[#0f2f57] dark:text-amber-400">
              <Link href={`/category/${(story.section || story.category.toLowerCase()).replace(/\s+/g, "-")}`} className="hover:underline">
                {categoryLabel}
              </Link>
              {sectionLabel && sectionLabel.toLowerCase() !== story.category.toLowerCase() && (
                <>
                  <span className="text-slate-400">›</span>
                  <span className="text-slate-500 dark:text-slate-400">{sectionLabel}</span>
                </>
              )}
            </div>

            <h1 className="mt-4 font-serif text-[2rem] font-black leading-[1.08] tracking-[-0.01em] text-balance sm:text-[2.7rem]">
              {story.title[language]}
            </h1>

            {story.excerpt?.[language] && (
              <p className="mt-5 border-l-2 border-slate-300 pl-4 font-serif text-lg italic leading-relaxed text-slate-600 dark:border-slate-700 dark:text-slate-300 sm:text-xl">
                {story.excerpt[language]}
              </p>
            )}

            <div className="mt-7 flex flex-wrap items-center gap-4 border-y border-slate-300 py-4 dark:border-slate-800">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#0f2f57] text-sm font-bold text-white dark:bg-amber-500 dark:text-slate-950">
                {initials}
              </span>
              <div className="min-w-0">
                <div className="font-semibold leading-tight">{authorName}</div>
                <div className="text-[11px] uppercase tracking-[0.14em] text-slate-500">{authorRole}</div>
              </div>
              <div className="ml-auto flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.12em] text-slate-500">
                {story.date && <span>{story.date}</span>}
                {story.date && <span aria-hidden>•</span>}
                <span>{minutes} {t("minRead")}</span>
                {story.readCount != null && (
                  <>
                    <span aria-hidden>•</span>
                    <span>{story.readCount.toLocaleString(language === "bn" ? "bn-BD" : "en-GB")} {t("reads")}</span>
                  </>
                )}
              </div>
            </div>

            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={speak}
                className="flex items-center gap-2 rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-[#0f2f57] transition hover:bg-white dark:border-slate-700 dark:text-amber-400 dark:hover:bg-slate-900"
              >
                🔊 {speaking ? t("stop") : t("listen")}
              </button>
              <button
                onClick={() => toggleSavedArticle(story.id)}
                className="flex items-center gap-2 rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold transition hover:bg-white dark:border-slate-700 dark:hover:bg-slate-900 lg:hidden"
              >
                {saved ? "🔖" : "♡"} {t("save")}
              </button>
              <div className="ml-auto flex gap-2 lg:hidden">{shareButtons}</div>
            </div>

            <figure className="mt-6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={story.image} alt={story.title.en} className="w-full rounded-md object-cover" />
              <figcaption className="mt-2 text-xs italic text-slate-500 dark:text-slate-400">
                {caption ? `${caption} ` : ""}<span className="not-italic">— {credit}</span>
              </figcaption>
            </figure>

            <div
              ref={bodyRef}
              className="article-body article-dropcap mt-8"
              dangerouslySetInnerHTML={{ __html: bodyHtml }}
            />

            {pullQuote && (
              <blockquote className="my-8 border-l-[3px] border-amber-500 pl-5 font-serif text-2xl italic leading-snug text-[#0f2f57] dark:border-amber-400 dark:text-[#f0ead9]">
                {pullQuote}
              </blockquote>
            )}

            {story.sourceUrl && (
              <a
                href={story.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-[#0f2f57] underline underline-offset-2 dark:text-amber-400"
              >
                {t("sourceReport")} ↗
              </a>
            )}

            <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-slate-300 pt-5 dark:border-slate-800">
              <div className="flex flex-wrap gap-2">
                {[categoryLabel, sectionLabel].filter(Boolean).map((tag, index) => (
                  <span
                    key={`${tag}-${index}`}
                    className="rounded-sm bg-slate-200 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{t("share")}</span>
                {shareButtons}
              </div>
            </div>

            <CommentSection slug={story.id} initialCount={story.commentCount ?? 0} />
          </article>
        </div>

        {related.length > 0 && (
          <section className="mx-auto mt-16 max-w-[940px]">
            <h2 className="mb-5 border-b-2 border-[#0f2f57] pb-2 font-serif text-xl font-black dark:border-amber-400">
              {t("readNext")}
            </h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((item) => (
                <Link key={item.id} href={`/article/${item.id}`} className="group block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.image} alt={item.title.en} className="mb-3 h-40 w-full rounded-md object-cover" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#0f2f57] dark:text-amber-400">
                    {language === "bn" ? item.categoryBn || item.category : item.category}
                  </span>
                  <h3 className="mt-1.5 font-serif text-lg font-bold leading-snug transition group-hover:text-[#0f2f57] dark:group-hover:text-amber-400">
                    {item.title[language]}
                  </h3>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
