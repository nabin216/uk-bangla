"use client";
import { useLanguage } from "@/context/LanguageContext";
import { useSavedArticles } from "@/context/SavedArticlesContext";

type Props = { onSaved: () => void; onCategory: (category: string) => void; onSearch: (value: string) => void; dark: boolean; onTheme: () => void };
export default function Header({ onSaved, onCategory, onSearch, dark, onTheme }: Props) {
  const { language, setLanguage, t } = useLanguage();
  const { savedArticleIds } = useSavedArticles();
  const nav = [["home", "All"], ["uk", "UK"], ["bangladesh", "Bangladesh"], ["world", "World"], ["business", "Business"], ["culture", "Culture"], ["opinion", "Opinion"]];
  return <header className="block border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
    <div className="bg-slate-100 px-4 py-2 text-xs dark:bg-slate-900"><div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3"><span className="font-bold text-blue-800 dark:text-amber-400">{new Date().toLocaleDateString(language === "bn" ? "bn-BD" : "en-GB", { dateStyle: "full" })}</span><span>☁ London 18°C · ☀ Dhaka 31°C · <b className="text-emerald-700">1 GBP = ৳152.50</b></span><div className="flex items-center gap-2"><button onClick={() => setLanguage("en")} className={language === "en" ? "rounded-full bg-blue-800 px-2 text-white" : ""}>EN</button><button onClick={() => setLanguage("bn")} className={language === "bn" ? "rounded-full bg-blue-800 px-2 text-white" : ""}>বাংলা</button><button onClick={onTheme}>{dark ? "☀" : "☾"}</button><button onClick={onSaved}>🔖 {t("saved")} <b className="rounded-full bg-amber-400 px-1 text-[10px] text-black">{savedArticleIds.length}</b></button></div></div></div>
    <div className="mx-auto flex max-w-6xl items-center justify-center gap-4 px-4 py-5"><div className="text-center"><div className="text-[10px] font-bold tracking-[.3em] text-slate-400">UK | BANGLA</div><div className="font-serif text-4xl font-black text-slate-900 dark:text-white">Guardian</div><div className="font-bengali font-bold text-amber-500">ইউকে বাংলা গার্ডিয়ান</div></div><input onChange={(e) => onSearch(e.target.value)} placeholder={t("search")} className="hidden w-44 rounded-full border bg-slate-50 px-4 py-2 text-xs dark:border-slate-700 dark:bg-slate-900 sm:absolute sm:right-4 sm:block lg:right-[max(1rem,calc((100vw-72rem)/2))]" /></div>
    <nav className="overflow-x-auto border-t border-slate-200 dark:border-slate-800"><div className="mx-auto flex max-w-6xl justify-center gap-6 px-4 py-3 text-xs font-bold uppercase tracking-wider">{nav.map(([key, value]) => <button key={value} onClick={() => onCategory(value)} className="hover:text-blue-700 dark:hover:text-amber-400">{t(key) || value}</button>)}</div></nav>
  </header>;
}
