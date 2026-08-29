"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
type SavedContext = { savedArticleIds: string[]; toggleSavedArticle: (id: string) => void };
const SavedArticlesContext = createContext<SavedContext | null>(null);
export function SavedArticlesProvider({ children }: { children: ReactNode }) {
  const [savedArticleIds, setSavedArticleIds] = useState<string[]>([]);
  useEffect(() => {
    const stored = window.localStorage.getItem("uk-bangla-saved");
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.every((id) => typeof id === "string")) {
        window.setTimeout(() => setSavedArticleIds(parsed), 0);
      }
    }
  }, []);
  useEffect(() => { window.localStorage.setItem("uk-bangla-saved", JSON.stringify(savedArticleIds)); }, [savedArticleIds]);
  const toggleSavedArticle = (id: string) => setSavedArticleIds((ids) => ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id]);
  return <SavedArticlesContext.Provider value={{ savedArticleIds, toggleSavedArticle }}>{children}</SavedArticlesContext.Provider>;
}
export function useSavedArticles() {
  const context = useContext(SavedArticlesContext);
  if (!context) throw new Error("useSavedArticles must be used inside SavedArticlesProvider");
  return context;
}
