import { API_URL } from "@/lib/api";
import type { HeaderBanner } from "@/types";

export default function AdBanner({ banner }: { banner: HeaderBanner }) {
  if (!banner.enabled || !banner.image) return null;

  const image = banner.image.startsWith("/") ? `${API_URL}${banner.image}` : banner.image;
  const content = (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={image} alt={banner.alt || "Advertisement"} className="h-auto max-h-32 w-full object-contain sm:max-h-40" />
  );

  return (
    <section className="my-8 overflow-hidden rounded border border-slate-200 bg-white p-2 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      {banner.link ? (
        <a href={banner.link} target="_blank" rel="noreferrer sponsored" aria-label={banner.alt || "Advertisement"}>
          {content}
        </a>
      ) : content}
    </section>
  );
}
