import type { Language, Story } from "@/types";
import { useLanguage } from "@/context/LanguageContext";
import { useSavedArticles } from "@/context/SavedArticlesContext";

function BookmarkIcon({ filled }: { filled: boolean }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={`h-4 w-4 stroke-current stroke-[1.8] ${filled ? "fill-current" : "fill-none"}`}>
      <path strokeLinejoin="round" d="M6 3.75h12a.75.75 0 0 1 .75.75v16.2l-6.75-4.5-6.75 4.5V4.5A.75.75 0 0 1 6 3.75Z" />
    </svg>
  );
}

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
  const { toggleSavedArticle, savedArticleIds } = useSavedArticles();
  const view = lang ?? language;
  return (
    <section className={compact ? "grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-5" : "grid grid-cols-1 gap-5 sm:grid-cols-3"}>
      {stories.map((story) => {
        const saved = savedArticleIds.includes(story.id);
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
              <span className="text-xs font-bold text-accent dark:text-amber-400">
                {view === "bn" ? story.categoryBn || story.category : story.category}
              </span>
              <h3
                className={`mt-1.5 font-serif font-bold leading-snug text-brand-dark decoration-accent decoration-2 underline-offset-4 group-hover:underline dark:text-slate-100 dark:decoration-amber-400 ${
                  compact ? "line-clamp-3 text-[15px] sm:text-base" : "line-clamp-3 text-lg sm:text-[1.15rem]"
                }`}
              >
                {story.title[view]}
              </h3>
              {!compact && synopsis && (
                <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{synopsis}</p>
              )}
              <div className="mt-auto flex items-center justify-between gap-2 pt-3 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                <span>{story.date}</span>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); toggleSavedArticle(story.id); }}
                  aria-label={saved ? "Remove from saved" : "Save article"}
                  aria-pressed={saved}
                  className={`-mr-1 rounded-full p-1.5 transition hover:bg-slate-100 dark:hover:bg-slate-800 ${
                    saved ? "text-accent dark:text-amber-400" : "text-slate-400 hover:text-brand dark:hover:text-amber-400"
                  }`}
                >
                  <BookmarkIcon filled={saved} />
                </button>
              </div>
            </div>
          </article>
        );
      })}
    </section>
  );
}
