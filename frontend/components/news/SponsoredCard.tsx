import type { Story } from "@/types";
import { useLanguage } from "@/context/LanguageContext";
export default function SponsoredCard({ story, onOpen }: { story: Story; onOpen: () => void }) {
  const { language, t } = useLanguage();
  return (
    <article
      onClick={onOpen}
      className="relative my-8 flex cursor-pointer flex-col gap-6 rounded-2xl border-2 border-amber-400/60 bg-amber-50 p-5 dark:bg-amber-950/30 md:flex-row"
    >
      <span className="absolute right-4 top-4 z-10 rounded-full bg-amber-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white shadow-sm">
        {t("sponsored")}
      </span>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={story.image} alt={story.title.en} className="h-52 w-full rounded-xl object-cover md:w-5/12" />
      <div className="flex flex-col justify-center">
        <span className="text-sm font-bold uppercase tracking-wide text-amber-700">♛ {t("partnerFeature")}</span>
        <h3 className="mt-3 font-serif text-2xl font-bold leading-tight sm:text-3xl">{story.title[language]}</h3>
        <p className="mt-3 text-base leading-relaxed text-slate-600 dark:text-slate-300">{story.excerpt?.[language] || story.title[language]}</p>
      </div>
    </article>
  );
}
