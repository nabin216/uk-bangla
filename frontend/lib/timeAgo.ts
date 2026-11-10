import type { Language } from "@/types";

const UNITS: Record<Language, { now: string; minute: string; hour: string; day: string }> = {
  en: { now: "Just now", minute: "min ago", hour: "hr ago", day: "d ago" },
  bn: { now: "এইমাত্র", minute: "মিনিট আগে", hour: "ঘণ্টা আগে", day: "দিন আগে" },
};

// "21 min ago" / "২১ মিনিট আগে" for the past week; older (or undated) stories return "".
export function timeAgo(iso: string | undefined, language: Language, now: number): string {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const minutes = Math.floor((now - then) / 60000);
  if (minutes < 0 || minutes >= 7 * 24 * 60) return "";
  const units = UNITS[language];
  const num = (value: number) => value.toLocaleString(language === "bn" ? "bn-BD" : "en-GB");
  if (minutes < 1) return units.now;
  if (minutes < 60) return `${num(minutes)} ${units.minute}`;
  if (minutes < 24 * 60) return `${num(Math.floor(minutes / 60))} ${units.hour}`;
  return `${num(Math.floor(minutes / (24 * 60)))} ${units.day}`;
}

// "১৭ নভেম্বর ২০২৫, ১১:৩০ পূর্বাহ্ণ" / "17 November 2025, 11:30 am" in the reader's time zone.
export function dateTimeLabel(iso: string | undefined, language: Language): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const locale = language === "bn" ? "bn-BD" : "en-GB";
  const day = new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric" })
    .formatToParts(date)
    .filter((part) => part.type !== "literal")
    .map((part) => part.value)
    .join(" ");
  const hour = date.getHours();
  const num = (value: number, pad = 1) => value.toLocaleString(locale, { minimumIntegerDigits: pad, useGrouping: false });
  const period = language === "bn" ? (hour < 12 ? "পূর্বাহ্ণ" : "অপরাহ্ণ") : hour < 12 ? "am" : "pm";
  return `${day}, ${num(hour % 12 || 12)}:${num(date.getMinutes(), 2)} ${period}`;
}

// "২৯ অক্টোবর ২০২৬" / "29 October 2026"; "" when the story has no usable date.
export function dateLabel(iso: string | undefined, language: Language): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(language === "bn" ? "bn-BD" : "en-GB", { day: "numeric", month: "long", year: "numeric" })
    .formatToParts(date)
    .filter((part) => part.type !== "literal")
    .map((part) => part.value)
    .join(" ");
}
