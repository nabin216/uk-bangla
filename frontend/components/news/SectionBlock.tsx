import Link from "next/link";
import type { SiteSection, Story } from "@/types";
import { useLanguage } from "@/context/LanguageContext";
import SectionHeading from "@/components/news/SectionHeading";

// One home-page section: a lead story with image and summary, then a short list of further headlines.
export default function SectionBlock({ section, stories }: { section: SiteSection; stories: Story[] }) {
  const { language, t } = useLanguage();
  const [lead, ...rest] = stories;
  if (!lead) return null;
  return (
    <section className="min-w-0">
      <SectionHeading
        title={language === "bn" ? section.name_bn || section.name : section.name}
        href={`/category/${section.slug}`}
        moreLabel={t("readMore")}
      />
      <Link href={`/article/${lead.id}`} className="group grid grid-cols-[42%_1fr] gap-4">
        <div className="overflow-hidden rounded bg-slate-200 dark:bg-slate-800">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            loading="lazy"
            decoding="async"
            src={lead.image}
            alt={lead.title.en}
            className="aspect-[16/10] h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
          />
        </div>
        <div className="min-w-0">
          <h3 className="line-clamp-3 font-serif text-lg font-bold leading-snug text-slate-900 group-hover:text-brand dark:text-slate-100 dark:group-hover:text-amber-400 sm:text-xl">
            {lead.title[language]}
          </h3>
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            {lead.synopsis[language]}
          </p>
        </div>
      </Link>
      {rest.length > 0 && (
        <ul className="mt-4 divide-y divide-slate-200 border-t border-slate-200 dark:divide-slate-800 dark:border-slate-800">
          {rest.map((story) => (
            <li key={story.id}>
              <Link
                href={`/article/${story.id}`}
                className="flex items-start gap-2 py-2.5 text-[15px] font-semibold leading-snug text-slate-800 hover:text-brand dark:text-slate-200 dark:hover:text-amber-400"
              >
                <span aria-hidden className="mt-[0.55em] h-1.5 w-1.5 shrink-0 bg-accent dark:bg-amber-400" />
                <span className="line-clamp-2">{story.title[language]}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
