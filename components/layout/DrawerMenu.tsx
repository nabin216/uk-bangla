"use client";
import { useLanguage } from "@/context/LanguageContext";
export default function DrawerMenu({ open, onClose, onCategory }: { open: boolean; onClose: () => void; onCategory: (category: string) => void }) {
  const { t } = useLanguage();
  return <div className={`fixed inset-0 z-50 transition ${open ? "visible bg-black/60" : "invisible pointer-events-none"}`} onClick={onClose}><aside className={`h-full w-80 bg-white p-6 shadow-2xl transition-transform dark:bg-slate-900 ${open ? "translate-x-0" : "-translate-x-full"}`} onClick={(e) => e.stopPropagation()}><div className="flex justify-between border-b pb-4 font-serif text-xl font-bold">Menu Navigation <button onClick={onClose}>✕</button></div><div className="mt-6 space-y-3">{["All", "UK", "Bangladesh", "World", "Business", "Culture", "Opinion"].map((item) => <button key={item} onClick={() => { onCategory(item); onClose(); }} className="block w-full rounded p-3 text-left font-semibold hover:bg-slate-100 dark:hover:bg-slate-800">{item === "All" ? t("home") : item}</button>)}</div></aside></div>;
}
