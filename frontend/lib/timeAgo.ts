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
