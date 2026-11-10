import Link from "next/link";
import type { SiteSection, Story } from "@/types";
import { useLanguage } from "@/context/LanguageContext";
import SectionHeading from "@/components/news/SectionHeading";
import { dateTimeLabel } from "@/lib/timeAgo";

// One home-page section: a lead story with image and summary, then a short list of further headlines.
export default function SectionBlock({ section, stories }: { section: SiteSection; stories: Story[] }) {
  const { language, t } = useLanguage();
  const [lead, ...rest] = stories;
  if (!lead) return null;
  const when = (story: Story) => dateTimeLabel(story.publishedAt, language) || story.date;
  const meta = "text-xs text-slate-500 dark:text-slate-400";
  return (
    <section className="min-w-0">
      <SectionHeading
        title={language === "bn" ? section.name_bn || section.name : section.name}
        href={`/category/${section.slug}`}
        moreLabel={t("allNews")}
      />
      <Link href={`/article/${lead.id}`} className="group grid grid-cols-[44%_1fr] gap-4">
        <div className="self-start overflow-hidden rounded-md bg-slate-200 dark:bg-slate-800">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            loading="lazy"
            decoding="async"
            src={lead.image}
            alt={lead.title.en}
            className="aspect-[16/10] w-full object-cover transition duration-500 group-hover:scale-[1.04]"
          />
        </div>
        <div className="min-w-0">
          <h3 className="line-clamp-3 font-serif text-lg font-bold leading-snug text-brand-dark group-hover:text-accent dark:text-slate-100 dark:group-hover:text-amber-400 sm:text-xl">
            {lead.title[language]}
          </h3>
          <p className="mt-1.5 line-clamp-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            {lead.synopsis[language]}
          </p>
          {when(lead) && <p className={`mt-1.5 ${meta}`}>{when(lead)}</p>}
        </div>
      </Link>
      {rest.length > 0 && (
        <ul className="mt-4 divide-y divide-slate-200 border-y border-slate-200 dark:divide-slate-800 dark:border-slate-800">
          {rest.map((story) => (
            <li key={story.id}>
              <Link href={`/article/${story.id}`} className="group block py-3">
                <span className="line-clamp-2 font-serif text-[17px] font-bold leading-snug text-brand-dark group-hover:text-accent dark:text-slate-100 dark:group-hover:text-amber-400">
                  {story.title[language]}
                </span>
                <span className={`mt-1 block ${meta}`}>
                  {language === "bn" ? story.categoryBn || story.category : story.category}
                  {when(story) && <span> | {when(story)}</span>}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
