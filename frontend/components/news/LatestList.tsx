import { useState } from "react";
import Link from "next/link";
import type { Story } from "@/types";
import { useLanguage } from "@/context/LanguageContext";
import { dateLabel, timeAgo } from "@/lib/timeAgo";
import SectionHeading from "@/components/news/SectionHeading";

export default function LatestList({ stories }: { stories: Story[] }) {
  const { language, t } = useLanguage();
  const [now] = useState(() => Date.now());
  if (!stories.length) return null;
  return (
    <aside>
      <SectionHeading title={t("latestNews")} />
      <ul className="divide-y divide-slate-300/80 dark:divide-slate-800">
        {stories.map((story) => {
          const when = timeAgo(story.publishedAt, language, now) || dateLabel(story.publishedAt, language) || story.date;
          return (
            <li key={story.id} className="py-3 first:pt-0 last:pb-0">
              <Link href={`/article/${story.id}`} className="group block">
                <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug text-slate-900 group-hover:text-brand dark:text-slate-100 dark:group-hover:text-amber-400">
                  {story.title[language]}
                </h3>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-semibold text-accent dark:text-amber-400">
                    {language === "bn" ? story.categoryBn || story.category : story.category}
                  </span>
                  {when && <span> · {when}</span>}
                </p>
              </Link>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
