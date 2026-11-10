import Link from "next/link";

// Red-bar heading with a rule running to the right edge and an optional "more" link.
export default function SectionHeading({
  title,
  href,
  moreLabel,
}: {
  title: string;
  href?: string;
  moreLabel?: string;
}) {
  return (
    <div className="mb-4 flex items-end gap-3">
      <h2 className="flex shrink-0 items-center gap-3 font-serif text-2xl font-bold leading-tight text-slate-900 dark:text-slate-100">
        <span aria-hidden className="h-6 w-1 bg-accent dark:bg-amber-400" />
        {title}
      </h2>
      <span aria-hidden className="mb-1.5 h-px min-w-4 flex-1 bg-brand/60 dark:bg-slate-700" />
      {href && moreLabel && (
        <Link href={href} className="mb-0.5 shrink-0 whitespace-nowrap text-sm font-semibold text-accent hover:underline dark:text-amber-400">
          {moreLabel} →
        </Link>
      )}
    </div>
  );
}
