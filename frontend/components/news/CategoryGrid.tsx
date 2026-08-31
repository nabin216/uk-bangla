import type { Story } from "@/types";
import { useLanguage } from "@/context/LanguageContext";

export default function CategoryGrid({
  stories,
  heading,
  onOpen,
}: {
  stories: Story[];
  heading: string;
  onOpen: (story: Story) => void;
}) {
  const { language } = useLanguage();
  if (!stories.length) return null;
  return (
    <section className="mb-10">
      <div className="mb-4 flex items-center justify-between border-b border-slate-300 pb-2">
        <h2 className="font-serif text-xl font-black">{heading}</h2>
      </div>
      <div className="grid grid-cols-1 gap-7 sm:grid-cols-3 sm:gap-5">
        {stories.map((story) => (
          <article
            key={story.id}
            onClick={() => onOpen(story)}
            className="grid cursor-pointer grid-cols-[128px_1fr] gap-4 sm:block"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={story.image} alt={story.title.en} className="h-28 w-full rounded object-cover sm:mb-3 sm:h-40" />
            <div>
              <span className="text-[10px] font-bold uppercase text-blue-900 dark:text-amber-400">
                {language === "bn" ? story.categoryBn || story.category : story.category}
              </span>
              <h3 className="mt-1 font-serif text-lg font-bold leading-tight sm:text-xl">{story.title[language]}</h3>
              <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                {story.excerpt?.[language] || story.title[language]}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
