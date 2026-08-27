"use client";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { dictionaries } from "@/data/dictionaries";
import type { Language } from "@/types";

type LanguageContextValue = { language: Language; setLanguage: (language: Language) => void; t: (key: string) => string };
const LanguageContext = createContext<LanguageContextValue | null>(null);
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>("en");
  useEffect(() => {
    document.documentElement.lang = language === "bn" ? "bn" : "en";
  }, [language]);
  const value = useMemo(() => ({ language, setLanguage, t: (key: string) => dictionaries[language][key] ?? key }), [language]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}
export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used inside LanguageProvider");
  return context;
}
