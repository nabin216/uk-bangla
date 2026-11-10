"use client";
import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { submitNewsletter } from "@/lib/api";

export default function Newsletter() {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const subscribe = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      await submitNewsletter(email);
      setDone(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t("subscribeFailed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="my-10 grid gap-6 rounded-lg border border-slate-200 bg-paper p-5 sm:p-7 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] md:items-center md:gap-8 dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-center gap-5">
        <svg aria-hidden="true" viewBox="0 0 24 24" className="hidden h-14 w-14 shrink-0 fill-none stroke-brand-dark stroke-[1.4] sm:block dark:stroke-amber-400">
          <rect x="3" y="5.5" width="18" height="13" rx="1.5" />
          <path strokeLinejoin="round" d="m3.5 6.5 8.5 6.5 8.5-6.5" />
        </svg>
        <div className="min-w-0 border-l-2 border-accent pl-5 dark:border-amber-400">
          <p className="text-sm font-bold text-accent dark:text-amber-400">{t("siteName")}</p>
          <h2 className="mt-1 font-serif text-2xl font-bold leading-snug text-brand-dark dark:text-slate-100">{t("newsletterTitle")}</h2>
          <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300">{t("newsletterLead")}</p>
        </div>
      </div>

      <div className="md:border-l md:border-slate-300 md:pl-8 dark:md:border-slate-700">
        {done ? (
          <p role="status" className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300">
            {t("subscribed")}
          </p>
        ) : (
          <form onSubmit={subscribe}>
            <label htmlFor="newsletter-email" className="block text-sm font-semibold text-brand-dark dark:text-slate-200">
              {t("emailLabel")}
            </label>
            <input
              id="newsletter-email"
              required
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("emailPlaceholder")}
              className="mt-1.5 w-full rounded-md border border-slate-300 bg-white px-4 py-2.5 text-[15px] outline-none focus:border-brand dark:border-slate-600 dark:bg-slate-950"
            />
            <button
              disabled={busy}
              className="mt-3 w-full rounded-md bg-brand-dark px-6 py-2.5 text-base font-bold text-white transition hover:bg-brand disabled:opacity-60 dark:bg-amber-400 dark:text-slate-950 dark:hover:bg-amber-300"
            >
              {busy ? "…" : <>{t("subscribeCta")} →</>}
            </button>
          </form>
        )}
        {error && <p role="alert" className="mt-2 text-xs text-red-600">{error}</p>}
        <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
          {t("unsubscribeNote")}{" "}
          <Link href="/privacy" className="font-medium text-brand-dark underline underline-offset-2 dark:text-slate-200">{t("privacyPolicy")}</Link>
        </p>
      </div>
    </section>
  );
}
