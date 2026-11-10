"use client";
import { useState } from "react";
import type { FormEvent } from "react";
import { useLanguage } from "@/context/LanguageContext";

const OPTION_KEYS = ["pollYes", "pollKeep", "pollUnsure"] as const;

export default function ReaderPoll() {
  const { t } = useLanguage();
  const [choice, setChoice] = useState<string | null>(null);
  const [voted, setVoted] = useState(false);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (choice) setVoted(true);
  };

  return (
    <section className="flex h-full flex-col rounded-lg bg-brand-dark p-5 text-white sm:p-6">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-base font-bold text-amber-400">{t("poll")}</span>
        <span aria-hidden className="h-5 w-px bg-amber-400/70" />
        <span className="rounded-md border border-white/70 px-2.5 py-0.5 text-xs font-medium">{t("pollTopic")}</span>
      </div>
      <h2 className="mt-4 font-serif text-xl font-bold leading-snug">{t("pollQuestion")}</h2>

      {voted ? (
        <p role="status" className="mt-5 rounded-md border border-emerald-300/40 bg-emerald-400/10 px-4 py-3 text-sm font-semibold text-emerald-200">
          {t("pollThanks")}
        </p>
      ) : (
        <form onSubmit={submit} className="mt-4">
          <fieldset className="space-y-2.5">
            <legend className="sr-only">{t("pollQuestion")}</legend>
            {OPTION_KEYS.map((key) => (
              <label
                key={key}
                className={`flex cursor-pointer items-center gap-3 rounded-md border px-4 py-2.5 text-[15px] transition ${
                  choice === key ? "border-amber-400 bg-white/10" : "border-white/60 hover:border-white hover:bg-white/5"
                }`}
              >
                <input
                  type="radio"
                  name="reader-poll"
                  value={key}
                  checked={choice === key}
                  onChange={() => setChoice(key)}
                  className="h-4 w-4 shrink-0 accent-amber-400"
                />
                {t(key)}
              </label>
            ))}
          </fieldset>
          <button
            type="submit"
            disabled={!choice}
            className="mt-4 rounded-md bg-amber-400 px-8 py-2.5 text-base font-bold text-brand-dark transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {t("vote")}
          </button>
        </form>
      )}
      <p className="mt-auto pt-4 text-xs text-blue-100/80">{t("pollNote")}</p>
    </section>
  );
}
