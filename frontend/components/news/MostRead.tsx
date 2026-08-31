import type { Story } from "@/types";
import { useLanguage } from "@/context/LanguageContext";

export default function MostRead({
  stories,
  heading,
  onOpen,
}: {
  stories: Story[];
  heading: string;
  onOpen: (story: Story) => void;
}) {
  const { language } = useLanguage();
  const rows = stories.slice(0, 4);
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
      <div className="mb-3 flex justify-between border-b pb-3">
        <h2 className="font-serif text-xl font-bold">{heading}</h2>
      </div>
      {rows.map((story) => (
        <button
          key={story.id}
          onClick={() => onOpen(story)}
          className="flex w-full items-center gap-3 border-b py-4 text-left last:border-0"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-300 text-[10px] dark:bg-slate-600">
            {story.readCount != null ? story.readCount.toLocaleString(language === "bn" ? "bn-BD" : "en-GB") : "●"}
          </span>
          <span className="min-w-0">
            <b className="block text-xs text-blue-900 dark:text-amber-400">
              {language === "bn" ? story.categoryBn || story.category : story.category}
            </b>
            <span className="mt-1 block font-serif text-sm font-bold leading-snug">{story.title[language]}</span>
          </span>
          <span className="ml-auto text-base text-amber-500">→</span>
        </button>
      ))}
    </section>
  );
}
