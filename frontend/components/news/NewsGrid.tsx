import type { Language, Story } from "@/types";
import { useLanguage } from "@/context/LanguageContext";
import { dateLabel } from "@/lib/timeAgo";


export default function NewsGrid({
  stories,
  onOpen,
  lang,
  compact,
}: {
  stories: Story[];
  onOpen: (story: Story) => void;
  lang?: Language;
  compact?: boolean;
}) {
  const { language } = useLanguage();
  const view = lang ?? language;
  return (
    <section className={compact ? "grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-5" : "grid grid-cols-1 gap-5 sm:grid-cols-3"}>
      {stories.map((story) => {
        const synopsis = story.synopsis?.[view];
        return (
          <article
            key={story.id}
            onClick={() => onOpen(story)}
            className="group flex cursor-pointer flex-col overflow-hidden rounded-md border border-slate-200 bg-white transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
          >
            <div className="relative aspect-[16/10] overflow-hidden bg-slate-100 dark:bg-slate-800">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                loading="lazy"
                decoding="async"
                src={story.image}
                alt={story.title.en}
                className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
              />
            </div>
            <div className={`flex flex-1 flex-col ${compact ? "p-3 sm:p-4" : "p-5"}`}>
              <span className="category-tag text-xs">
                {view === "bn" ? story.categoryBn || story.category : story.category}
              </span>
              <h3
                className={`mt-2.5 font-serif font-bold leading-snug text-brand-dark decoration-accent decoration-2 underline-offset-4 group-hover:underline dark:text-slate-100 dark:decoration-amber-400 ${
                  compact ? "line-clamp-3 text-[15px] sm:text-base" : "line-clamp-3 text-lg sm:text-[1.15rem]"
                }`}
              >
                {story.title[view]}
              </h3>
              {!compact && synopsis && (
                <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{synopsis}</p>
              )}
              <p className="mt-auto pt-3 text-xs font-medium text-slate-500 dark:text-slate-400">
                {dateLabel(story.publishedAt, view) || story.date}
              </p>
            </div>
          </article>
        );
      })}
    </section>
  );
}
