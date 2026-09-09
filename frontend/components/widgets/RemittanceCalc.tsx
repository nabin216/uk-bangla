"use client";
import { useEffect, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { API_URL, fetchSite } from "@/lib/api";

export default function RemittanceCalc() {
  const { language, t } = useLanguage();
  const [gbp, setGbp] = useState(500);
  const [rate, setRate] = useState(152.5);
  const [trend, setTrend] = useState("");

  useEffect(() => {
    if (!API_URL) return;
    let alive = true;
    fetchSite()
      .then((data) => {
        if (!alive) return;
        if (data.settings?.gbp_to_bdt_rate) setRate(data.settings.gbp_to_bdt_rate);
        setTrend(data.settings?.fx_trend_note?.[language] || "");
      })
      .catch(() => undefined);
    return () => { alive = false; };
  }, [language]);

  const received = (gbp * rate).toLocaleString(language === "bn" ? "bn-BD" : "en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const rateLabel = rate.toLocaleString(language === "bn" ? "bn-BD" : "en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <section className="my-8 rounded-lg border border-blue-200 bg-[#e9f1fb] p-5 text-slate-900 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-blue-800 dark:text-amber-400">
            {language === "bn" ? "সরাসরি অনলাইন হার" : "Live online rate"}
          </div>
          <h2 className="mt-1 font-serif text-xl font-bold text-slate-950 dark:text-white">{t("rate")}</h2>
          <p className="mt-1 max-w-xs text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            {language === "bn" ? `১ পাউন্ড = ৳${rateLabel}` : `£1 = ৳${rateLabel}`} &middot; {t("rateSub")}
          </p>
        </div>
        {trend && <span className="hidden text-sm font-semibold text-emerald-700 dark:text-emerald-300 sm:block">{trend}</span>}
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-3">
        <label className="text-[10px] font-bold uppercase text-slate-600 dark:text-slate-300">
          {t("send")}
          <input
            type="number"
            value={gbp}
            min={0}
            onChange={(e) => setGbp(Math.max(0, Number(e.target.value)))}
            className="mt-1 w-full rounded border border-slate-200 bg-white px-3 py-2 text-base font-bold text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none"
          />
        </label>
        <span className="pb-2 text-base font-bold text-blue-800 dark:text-amber-400">→</span>
        <label className="text-[10px] font-bold uppercase text-slate-600 dark:text-slate-300">
          {t("receive")}
          <output className="mt-1 block rounded border border-amber-200 bg-[#f5e6b8] px-3 py-2 text-base font-bold text-slate-900 shadow-sm">
            ৳{received}
          </output>
        </label>
      </div>
    </section>
  );
}
