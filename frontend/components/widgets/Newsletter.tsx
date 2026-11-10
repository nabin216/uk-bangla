"use client";
import { useState } from "react";
import type { FormEvent } from "react";
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
    setError(""); setBusy(true);
    try { await submitNewsletter(email); setDone(true); } catch (caught) { setError(caught instanceof Error ? caught.message : "Subscription failed. Please try again."); } finally { setBusy(false); }
  };
  return <section className="my-12 rounded-lg border border-slate-200 bg-slate-100 p-6 dark:border-slate-700 dark:bg-slate-800"><div className="mx-auto max-w-3xl text-center"><span className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">{t("stayInformed")}</span><h2 className="mt-2 font-serif text-3xl font-bold text-slate-800 dark:text-slate-100">{t("dailyBrief")}</h2><p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">{t("newsletterSub")}</p>{done ? <p className="mx-auto mt-6 max-w-md rounded border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300">{t("subscribed")}</p> : <form onSubmit={subscribe} className="mx-auto mt-6 flex max-w-lg flex-col gap-2 sm:flex-row"><input id="newsletter-email" required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t("email")} className="min-w-0 flex-1 rounded border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-slate-500 dark:border-slate-600 dark:bg-slate-900" /><button disabled={busy} className="rounded bg-slate-700 px-6 py-3 text-xs font-semibold uppercase tracking-wider text-white transition hover:bg-slate-800 disabled:opacity-60 dark:bg-slate-600 dark:hover:bg-slate-500">{busy ? "…" : t("subscribe")}</button></form>}{error && <p className="mt-2 text-xs text-red-600">{error}</p>}<p className="mt-4 text-xs text-slate-500">No spam. Just the stories that matter.</p></div></section>;
}
