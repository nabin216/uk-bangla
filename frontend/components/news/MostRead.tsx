import Link from "next/link";
import type { Story } from "@/types";
import { useLanguage } from "@/context/LanguageContext";

// Opinion / most-read box: quote-marked headlines with an optional "view all" link.
export default function MostRead({
  stories,
  heading,
  onOpen,
  href,
  moreLabel,
}: {
  stories: Story[];
  heading: string;
  onOpen: (story: Story) => void;
  href?: string;
  moreLabel?: string;
}) {
  const { language } = useLanguage();
  const rows = stories.slice(0, 3);
  return (
    <section className="h-full rounded-lg border border-slate-300 bg-white p-5 sm:p-6 dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-center justify-between gap-3 border-b border-slate-300 pb-4 dark:border-slate-700">
        <h2 className="flex items-center gap-3 font-serif text-2xl font-bold text-brand-dark dark:text-slate-100">
          <span aria-hidden className="h-7 w-1.5 bg-accent dark:bg-amber-400" />
          {heading}
        </h2>
        {href && moreLabel && (
          <Link href={href} className="shrink-0 whitespace-nowrap text-sm font-semibold text-accent hover:underline dark:text-amber-400">
            {moreLabel} →
          </Link>
        )}
      </div>
      <ul className="divide-y divide-slate-200 dark:divide-slate-700">
        {rows.map((story) => (
          <li key={story.id}>
            <button type="button" onClick={() => onOpen(story)} className="group flex w-full items-center gap-4 py-4 text-left">
              <svg aria-hidden="true" viewBox="0 0 40 30" className="h-7 w-10 shrink-0 fill-accent/30 dark:fill-amber-400/40">
                <path d="M0 30V18C0 8 5 2 15 0l2 5c-5 1.500-7 4.500-7 9h7v16H0Zm22 0V18c0-10 5-16 15-18l2 5c-5 1.500-7 4.500-7 9h7v16H22Z" />
              </svg>
              <span className="min-w-0 flex-1 border-l border-slate-300 pl-4 dark:border-slate-700">
                <span className="line-clamp-2 font-serif text-[17px] font-bold leading-snug text-brand-dark group-hover:text-accent dark:text-slate-100 dark:group-hover:text-amber-400">
                  {story.title[language]}
                </span>
                <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">
                  {language === "bn" ? story.categoryBn || story.category : story.category}
                  {story.date && <span> · {story.date}</span>}
                </span>
              </span>
              <span aria-hidden className="shrink-0 text-lg text-accent transition group-hover:translate-x-0.5 dark:text-amber-400">→</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
