import Link from "next/link";
import type { Story } from "@/types";
import { useLanguage } from "@/context/LanguageContext";

export default function LeadStoryHero({ story }: { story: Story }) {
  const { language, t } = useLanguage();
  const href = `/article/${story.id}`;
  return (
    <article className="grid items-center gap-5 sm:grid-cols-[1.2fr_1fr] sm:gap-7">
      <Link href={href} className="group block overflow-hidden rounded-md bg-slate-200 dark:bg-slate-800">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={story.image}
          alt={story.title.en}
          fetchPriority="high"
          decoding="async"
          className="aspect-[16/10] w-full object-cover transition duration-500 group-hover:scale-[1.03]"
        />
      </Link>
      <div className="flex min-w-0 flex-col justify-center">
        <span className="text-sm font-semibold text-accent dark:text-amber-400">
          {language === "bn" ? story.categoryBn || story.category : story.category}
        </span>
        <h1 className="mt-2 font-serif text-2xl font-bold leading-[1.25] text-slate-950 dark:text-slate-50 sm:text-[1.7rem] lg:text-[1.9rem]">
          <Link href={href} className="hover:text-brand dark:hover:text-amber-400">{story.title[language]}</Link>
        </h1>
        <p className="mt-3 line-clamp-4 text-[15px] leading-relaxed text-slate-600 dark:text-slate-300">
          {story.synopsis[language] || story.title[language]}
        </p>
        <Link href={href} className="mt-3 self-start text-[15px] font-semibold text-accent hover:underline dark:text-amber-400">
          {t("readFull")} →
        </Link>
      </div>
    </article>
  );
}
