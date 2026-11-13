"use client";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import type { HeaderBanner, Story } from "@/types";
import { useLanguage } from "@/context/LanguageContext";
import CommentSection from "@/components/news/CommentSection";
import LatestList from "@/components/news/LatestList";
import AdBanner from "@/components/news/AdBanner";

// Reader-selectable body text sizes (multipliers of the normal size); index 1 is the default.
const FONT_STEPS = [0.9, 1, 1.15, 1.3];

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

// The API host and the page host can differ only by "www." (both serve the same files).
// Canvas needs same-origin images, so such URLs are loaded from the page's own origin.
function sameOriginUrl(source: string) {
  try {
    const url = new URL(source, window.location.href);
    const bare = (host: string) => host.replace(/^www\./, "");
    if (url.origin !== window.location.origin && bare(url.hostname) === bare(window.location.hostname)) {
      return `${window.location.origin}${url.pathname}${url.search}`;
    }
  } catch {
    // Fall through to the original URL.
  }
  return source;
}

function loadCardImage(rawSource: string) {
  const source = sameOriginUrl(rawSource);
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Image could not be loaded"));
    image.src = source;
  });
}

// Breaks text into lines no wider than maxWidth, using the context's current font.
function wrapCardText(context: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const candidate = line ? `${line} ${word}` : word;
    if (context.measureText(candidate).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
}

// A headline written as "main headline : short label" (or the reverse) is split so the
// short part can run as the card's kicker line above the headline.
function splitCardTitle(title: string): { kicker: string; headline: string } {
  const parts = title.split(/\s+[:：]\s*|\s*[:：]\s+/);
  if (parts.length === 2) {
    const [first, second] = parts.map((part) => part.trim());
    if (second && second.length <= 28 && first.length > second.length) return { kicker: second, headline: first };
    if (first && first.length <= 28 && second.length > first.length) return { kicker: first, headline: second };
  }
  return { kicker: "", headline: title };
}

function SocialIcon({ label }: { label: string }) {
  if (label === "Facebook") {
    return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-current"><path d="M14 8h3V4h-3c-3.3 0-5 1.9-5 5v3H6v4h3v8h4v-8h3.5l.5-4H13V9c0-.7.3-1 1-1Z" /></svg>;
  }
  if (label === "X") {
    return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-current"><path d="M18.2 3H22l-8.3 9.5L23.5 21h-7.4l-5.8-6.6L4.6 21H.8l8.9-10.2L.5 3H8l5.3 6.1L18.2 3Zm-1.3 15.3h2.1L6.9 5.6H4.7l12.2 12.7Z" /></svg>;
  }
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-[1.8]"><circle cx="12" cy="12" r="9" /><path strokeLinecap="round" strokeLinejoin="round" d="M8.7 8.5c.3-.4.7-.5 1.1-.2l1.1 1c.3.3.3.7.1 1l-.5.7c.7 1.3 1.7 2.3 3 3l.7-.5c.3-.2.7-.2 1 .1l1 1.1c.3.4.2.8-.2 1.1-.6.5-1.4.7-2.1.4-3.2-1.2-5.6-3.6-6.8-6.8-.3-.7-.1-1.5.4-2.1Z" /></svg>;
}

export default function ArticleReader({
  story,
  related,
  latest = [],
  banner,
}: {
  story: Story;
  related: Story[];
  latest?: Story[];
  banner?: HeaderBanner;
}) {
  const { language, t } = useLanguage();
  const [progress, setProgress] = useState(0);
  const [speaking, setSpeaking] = useState(false);
  const [copied, setCopied] = useState(false);
  const [url, setUrl] = useState("");
  const [fontStep, setFontStep] = useState(1);
  const [cardOpen, setCardOpen] = useState(false);
  const [cardPreview, setCardPreview] = useState<{ blob: Blob; url: string } | null>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  const bodyHtml = useMemo(() => buildBodyHtml(story.body[language] || story.excerpt?.[language] || ""), [story, language]);

  const authorRaw = language === "bn" ? story.authorBn || story.author : story.author;
  const match = authorRaw.match(/^(.*?)\s*\((.+)\)\s*$/);
  const authorName = match ? match[1].trim() : authorRaw;
  const categoryLabel = language === "bn" ? story.categoryBn || story.category : story.category;
  const categoryHref = `/category/${(story.section || story.category.toLowerCase()).replace(/\s+/g, "-")}`;
  const dateLabel = story.publishedAt
    ? new Date(story.publishedAt).toLocaleDateString(language === "bn" ? "bn-BD" : "en-GB", { day: "numeric", month: "long", year: "numeric" })
    : story.date;
  // The share card prints the date as "০১ নভেম্বর ২০২৬" / "01 November 2026".
  const cardDate = story.publishedAt
    ? new Intl.DateTimeFormat(language === "bn" ? "bn-BD" : "en-GB", { day: "2-digit", month: "long", year: "numeric" })
        .formatToParts(new Date(story.publishedAt))
        .filter((part) => part.type !== "literal")
        .map((part) => part.value)
        .join(" ")
    : story.date || "";
  const sectionLabel =(story.section || "").replace(/-/g, " ");
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

  const printArticle = () => window.print();

  const buildCard = async (): Promise<Blob | null> => {
    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1080;
    const context = canvas.getContext("2d");
    if (!context) return null;

    // Card layout: cream masthead strip, photo, then a navy panel with the headline.
    const SIDE = 58;
    const RIGHT = 1080 - SIDE;
    const HEADER_BOTTOM = 156;
    const IMAGE_BOTTOM = 602;
    const CREAM = "#faf6ee";
    const NAVY = "#0a1f55";
    const GOLD = "#f2b632";
    const family = language === "bn" ? '"Hind Siliguri", "Noto Sans Bengali", sans-serif' : "Inter, sans-serif";
    const { kicker, headline } = splitCardTitle(story.title[language]);
    try {
      // Canvas falls back to a system font unless the web font has finished loading.
      await Promise.all([document.fonts.load(`700 60px ${family}`, headline), document.fonts.load(`600 26px ${family}`, headline)]);
    } catch {
      // The fallback font still produces a usable card.
    }

    context.fillStyle = NAVY;
    context.fillRect(0, 0, 1080, 1080);
    try {
      const articleImage = await loadCardImage(story.image);
      const imageHeightBox = IMAGE_BOTTOM - HEADER_BOTTOM;
      const imageRatio = Math.max(1080 / articleImage.naturalWidth, imageHeightBox / articleImage.naturalHeight);
      const imageWidth = articleImage.naturalWidth * imageRatio;
      const imageHeight = articleImage.naturalHeight * imageRatio;
      context.save();
      context.beginPath();
      context.rect(0, HEADER_BOTTOM, 1080, imageHeightBox);
      context.clip();
      context.drawImage(articleImage, (1080 - imageWidth) / 2, HEADER_BOTTOM + (imageHeightBox - imageHeight) / 2, imageWidth, imageHeight);
      context.restore();
    } catch {
      // Keep the branded card usable when a remote image blocks canvas access.
    }

    context.fillStyle = CREAM;
    context.fillRect(0, 0, 1080, HEADER_BOTTOM);
    try {
      const logo = await loadCardImage("/logo.png");
      const logoHeight = 98;
      context.drawImage(logo, SIDE, (HEADER_BOTTOM - logoHeight) / 2, (logo.naturalWidth / logo.naturalHeight) * logoHeight, logoHeight);
    } catch {
      context.fillStyle = NAVY;
      context.font = "700 34px Inter, sans-serif";
      context.fillText("UK Bangla Guardian", SIDE, 90);
    }

    // Category, right-aligned in the masthead strip with a gold underline.
    context.textAlign = "right";
    context.fillStyle = NAVY;
    context.font = `700 40px ${family}`;
    context.fillText(categoryLabel, RIGHT, 92);
    context.fillStyle = GOLD;
    context.fillRect(RIGHT - context.measureText(categoryLabel).width, 112, context.measureText(categoryLabel).width, 4);
    context.textAlign = "left";

    let headlineTop = 644;
    if (kicker) {
      context.fillStyle = GOLD;
      context.font = `700 36px ${family}`;
      context.fillText(kicker, SIDE, 676);
      headlineTop = 704;
    }

    // Use the largest headline size that fits the panel; trim with an ellipsis as a last resort.
    const headlineBottom = 962;
    const sizes = [78, 70, 62, 54, 48, 42];
    let size = sizes[sizes.length - 1];
    let lines: string[] = [];
    for (const candidate of sizes) {
      context.font = `700 ${candidate}px ${family}`;
      lines = wrapCardText(context, headline, RIGHT - SIDE);
      size = candidate;
      if (lines.length * candidate * 1.28 <= headlineBottom - headlineTop) break;
    }
    const lineHeight = size * 1.28;
    const maxLines = Math.max(1, Math.floor((headlineBottom - headlineTop) / lineHeight));
    if (lines.length > maxLines) {
      lines = lines.slice(0, maxLines);
      lines[maxLines - 1] = `${lines[maxLines - 1].replace(/\s+\S*$/, "")}…`;
    }
    context.fillStyle = "#ffffff";
    lines.forEach((line, index) => context.fillText(line, SIDE, headlineTop + size + index * lineHeight));

    context.fillStyle = GOLD;
    context.fillRect(SIDE, 982, RIGHT - SIDE, 2);
    context.font = `600 26px ${family}`;
    context.fillStyle = "#ffffff";
    context.fillText(cardDate, SIDE, 1030);
    context.fillStyle = GOLD;
    context.textAlign = "right";
    context.font = "600 26px Inter, sans-serif";
    context.fillText("ukbanglaguardian.com", RIGHT, 1030);
    context.textAlign = "left";

    return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
  };

  const cardFileName = `uk-bangla-${story.id}-social-card.png`;

  const openCardPreview = async () => {
    setCardOpen(true);
    setCardPreview(null);
    const blob = await buildCard();
    if (!blob) {
      setCardOpen(false);
      return;
    }
    setCardPreview({ blob, url: URL.createObjectURL(blob) });
  };

  const closeCardPreview = () => {
    setCardOpen(false);
    setCardPreview((current) => {
      if (current) URL.revokeObjectURL(current.url);
      return null;
    });
  };

  const downloadCard = () => {
    if (!cardPreview) return;
    const link = document.createElement("a");
    link.href = cardPreview.url;
    link.download = cardFileName;
    link.click();
  };

  const canShareCard = Boolean(
    cardPreview &&
    typeof navigator !== "undefined" &&
    navigator.canShare?.({ files: [new File([cardPreview.blob], cardFileName, { type: "image/png" })] }),
  );

  const shareCard = async () => {
    if (!cardPreview) return;
    try {
      await navigator.share({
        files: [new File([cardPreview.blob], cardFileName, { type: "image/png" })],
        title: story.title[language],
        url: url || window.location.href,
      });
    } catch {
      // The reader cancelled the share sheet; the preview stays open.
    }
  };

  useEffect(() => {
    if (!cardOpen) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") closeCardPreview(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cardOpen]);

  const encoded = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(story.title[language]);
  const shareLinks = [
    { label: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${encoded}` },
    { label: "X", href: `https://twitter.com/intent/tweet?url=${encoded}&text=${encodedTitle}` },
    { label: "WhatsApp", href: `https://wa.me/?text=${encodedTitle}%20${encoded}` },
  ];

  const shareButtons = (
    <>
      {shareLinks.map((link) => (
        <a
          key={link.label}
          href={link.href}
          target="_blank"
          rel="noreferrer"
          aria-label={`${t("share")} — ${link.label}`}
          className={`flex h-7 w-7 items-center justify-center rounded-full transition hover:opacity-80 ${
            link.label === "Facebook"
              ? "bg-[#1877f2] text-white"
              : link.label === "X"
                ? "text-slate-950 dark:text-white"
                : "bg-[#25d366] text-white"
          }`}
        >
          <SocialIcon label={link.label} />
        </a>
      ))}
      <button
        type="button"
        onClick={copyLink}
        aria-label={t("copyLink")}
        title={copied ? t("linkCopied") : t("copyLink")}
        className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-200 text-slate-700 transition hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
      >
        {copied ? "✓" : (
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-none stroke-current stroke-2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />
          </svg>
        )}
      </button>
    </>
  );

  const toolButton = "flex items-center gap-2 rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-brand transition hover:bg-white dark:border-slate-700 dark:text-amber-400 dark:hover:bg-slate-900";
  const fontButton = "flex h-7 min-w-8 items-center justify-center rounded border border-slate-300 bg-white px-1.5 font-serif font-bold leading-none text-slate-800 transition hover:border-brand disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100";

  return (
    <main className="bg-paper pb-4 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="fixed inset-x-0 top-0 z-40 h-1 bg-transparent">
        <div className="h-full bg-amber-500 transition-[width] duration-150 ease-out" style={{ width: `${progress}%` }} />
      </div>

      {cardOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t("cardPreview")}
          onClick={closeCardPreview}
          className="no-print fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
        >
          <div
            onClick={(event) => event.stopPropagation()}
            className="flex max-h-full w-full max-w-md flex-col overflow-hidden rounded-lg bg-white shadow-2xl dark:bg-slate-900"
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
              <span className="text-sm font-bold text-[#0f2f57] dark:text-amber-400">{t("cardPreview")}</span>
              <button
                type="button"
                onClick={closeCardPreview}
                aria-label={t("close")}
                className="rounded px-2 text-2xl leading-none text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                ×
              </button>
            </div>
            <div className="flex min-h-0 flex-1 items-center justify-center bg-slate-100 p-4 dark:bg-slate-950">
              {cardPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={cardPreview.url} alt={story.title[language]} className="max-h-[60vh] w-full rounded object-contain shadow-md" />
              ) : (
                <div className="flex aspect-square w-full items-center justify-center text-sm text-slate-500">
                  {t("preparingCard")}
                </div>
              )}
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-4 py-3 dark:border-slate-800">
              <button
                type="button"
                onClick={closeCardPreview}
                className="rounded-full border border-slate-300 px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                {t("close")}
              </button>
              {canShareCard && (
                <button
                  type="button"
                  onClick={shareCard}
                  className="rounded-full border border-[#0f2f57] px-4 py-1.5 text-xs font-semibold text-[#0f2f57] hover:bg-slate-50 dark:border-amber-400 dark:text-amber-400 dark:hover:bg-slate-800"
                >
                  {t("share")}
                </button>
              )}
              <button
                type="button"
                onClick={downloadCard}
                disabled={!cardPreview}
                className="rounded-full border border-amber-500 bg-amber-400 px-4 py-1.5 text-xs font-semibold text-slate-950 hover:bg-amber-300 disabled:opacity-50"
              >
                ⬇ {t("download")}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-6xl px-4 pt-5 sm:px-6">
        <div className="print-only mb-6 border-b border-slate-300 pb-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="UK Bangla Guardian" className="h-16 w-auto" />
        </div>
        <nav aria-label="Breadcrumb" className="no-print flex flex-wrap items-center gap-x-3 text-sm text-slate-600 dark:text-slate-400">
          <Link href="/" className="hover:text-brand dark:hover:text-amber-400">{t("home")}</Link>
          <span aria-hidden>/</span>
          <Link href={categoryHref} className="hover:text-brand dark:hover:text-amber-400">{categoryLabel}</Link>
        </nav>

        <div className="mt-4 grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-7">
          <article className="min-w-0">
            <Link
              href={categoryHref}
              className="category-tag text-sm"
            >
              {categoryLabel}
            </Link>

            <h1 className="mt-3 font-serif text-[1.7rem] font-bold leading-[1.25] text-slate-950 text-balance dark:text-slate-50 sm:text-[2.2rem]">
              {story.title[language]}
            </h1>

            {story.excerpt?.[language] && (
              <p className="mt-3 text-lg leading-relaxed text-slate-700 dark:text-slate-300">
                {story.excerpt[language]}
              </p>
            )}

            <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-3 border-y border-slate-300 py-3 text-[13px] dark:border-slate-800">
              <span className="flex items-center gap-2 font-semibold">
                <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-2">
                  <circle cx="12" cy="8" r="4" />
                  <path strokeLinecap="round" d="M4 21c0-4 3.6-6 8-6s8 2 8 6" />
                </svg>
                {authorName}
              </span>
              {dateLabel && (
                <span className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-2">
                    <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
                    <path strokeLinecap="round" d="M8 3v4m8-4v4M3.5 10h17" />
                  </svg>
                  {dateLabel}
                </span>
              )}
              <span className="no-print flex items-center gap-2">
                <span className="font-semibold">{t("shareLabel")}</span>
                {shareButtons}
              </span>
              <span className="no-print flex items-center gap-1.5 sm:ml-auto">
                <span className="mr-1 text-slate-600 dark:text-slate-400">{t("fontSize")}</span>
                <button type="button" onClick={() => setFontStep((step) => Math.max(0, step - 1))} disabled={fontStep === 0} aria-label="Smaller text" className={`${fontButton} text-xs`}>A−</button>
                <button type="button" onClick={() => setFontStep(1)} aria-label="Normal text" className={`${fontButton} text-sm`}>A</button>
                <button type="button" onClick={() => setFontStep((step) => Math.min(FONT_STEPS.length - 1, step + 1))} disabled={fontStep === FONT_STEPS.length - 1} aria-label="Larger text" className={`${fontButton} text-base`}>A+</button>
              </span>
            </div>

            <figure className="mt-5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={story.image} alt={story.title.en} className="w-full rounded-md object-cover" />
              <figcaption className="mt-2 border-b border-slate-300 pb-3 text-sm italic text-slate-500 dark:border-slate-800 dark:text-slate-400">
                {caption ? `${caption} ` : ""}<span className="not-italic">— {credit}</span>
              </figcaption>
            </figure>

            <div className="no-print mt-4 flex flex-wrap items-center gap-2">
              <button type="button" onClick={speak} className={toolButton}>
                🔊 {speaking ? t("stop") : t("listen")}
              </button>
              <button type="button" onClick={printArticle} aria-label={t("print")} className={toolButton}>
                🖨 {t("print")}
              </button>
              <button
                type="button"
                onClick={openCardPreview}
                aria-label={t("saveCard")}
                className="flex items-center gap-2 rounded-full border border-amber-500 bg-amber-400 px-3 py-1.5 text-xs font-semibold text-slate-950 transition hover:bg-amber-300"
              >
                ▣ {t("saveCard")}
              </button>
            </div>

            <div
              ref={bodyRef}
              className="article-body mt-6"
              style={{ "--article-scale": FONT_STEPS[fontStep] } as CSSProperties}
              dangerouslySetInnerHTML={{ __html: bodyHtml }}
            />

            {pullQuote && (
              <blockquote className="my-8 border-l-[3px] border-accent pl-5 font-serif text-2xl italic leading-snug text-brand dark:border-amber-400 dark:text-[#f0ead9]">
                {pullQuote}
              </blockquote>
            )}

            {story.sourceUrl && (
              <a
                href={story.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-brand underline underline-offset-2 dark:text-amber-400"
              >
                {t("sourceReport")} ↗
              </a>
            )}

            <div className="no-print mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-slate-300 pt-5 dark:border-slate-800">
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
              <div className="flex items-center gap-2 text-sm">
                <span className="font-semibold">{t("shareLabel")}</span>
                {shareButtons}
              </div>
            </div>

            <CommentSection slug={story.id} initialCount={story.commentCount ?? 0} />
          </article>

          <aside className="no-print min-w-0 lg:border-l lg:border-slate-300 lg:pl-7 dark:lg:border-slate-800">
            <div className="lg:sticky lg:top-6">
              <LatestList stories={latest} />
              {banner && <AdBanner banner={banner} />}
            </div>
          </aside>
        </div>

        {related.length > 0 && (
          <section className="mt-14">
            <h2 className="mb-5 flex items-center gap-3 border-b border-brand/60 pb-2 font-serif text-2xl font-bold dark:border-slate-700">
              <span aria-hidden className="h-6 w-1 bg-accent dark:bg-amber-400" />
              {t("readNext")}
            </h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((item) => (
                <Link key={item.id} href={`/article/${item.id}`} className="group block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.image} alt={item.title.en} className="mb-3 aspect-[16/10] w-full rounded-md object-cover" />
                  <span className="text-xs font-semibold text-accent dark:text-amber-400">
                    {language === "bn" ? item.categoryBn || item.category : item.category}
                  </span>
                  <h3 className="mt-1 font-serif text-lg font-bold leading-snug transition group-hover:text-brand dark:group-hover:text-amber-400">
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
