import { useLanguage } from "@/context/LanguageContext";

export default function TickerBanner({ items }: { items: string[] }) {
  const { t } = useLanguage();
  if (!items.length) return null;
  // Rendered twice so the -50% marquee loop is seamless.
  const run = (hidden: boolean) => (
    <span aria-hidden={hidden || undefined} className="flex shrink-0 items-center pl-5">
      {items.map((item, i) => (
        <span key={i} className="flex items-center">
          <span>{item}</span>
          <span aria-hidden className="mx-5 text-white/70">•</span>
        </span>
      ))}
    </span>
  );
  return (
    <div className="overflow-hidden bg-brand text-sm font-medium text-white dark:bg-slate-900">
      <div className="mx-auto flex max-w-6xl items-center px-4 sm:px-6">
        <span
          className="relative z-10 shrink-0 bg-accent py-1.5 pl-4 pr-6 font-bold"
          style={{ clipPath: "polygon(0 0, calc(100% - 12px) 0, 100% 50%, calc(100% - 12px) 100%, 0 100%)" }}
        >
          {t("latest")}
        </span>
        <div className="min-w-0 flex-1 overflow-hidden py-2.5">
          <div className="animate-marquee flex w-max whitespace-nowrap hover:[animation-play-state:paused]">
            {run(false)}
            {run(true)}
          </div>
        </div>
      </div>
    </div>
  );
}
