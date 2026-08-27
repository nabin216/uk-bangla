"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
type SavedContext = { savedArticleIds: string[]; toggleSavedArticle: (id: string) => void };
const SavedArticlesContext = createContext<SavedContext | null>(null);
export function SavedArticlesProvider({ children }: { children: ReactNode }) {
  const [savedArticleIds, setSavedArticleIds] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    const stored = window.localStorage.getItem("uk-bangla-saved");
    return stored ? (JSON.parse(stored) as string[]) : [];
  });
  useEffect(() => { window.localStorage.setItem("uk-bangla-saved", JSON.stringify(savedArticleIds)); }, [savedArticleIds]);
  const toggleSavedArticle = (id: string) => setSavedArticleIds((ids) => ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id]);
  return <SavedArticlesContext.Provider value={{ savedArticleIds, toggleSavedArticle }}>{children}</SavedArticlesContext.Provider>;
}
export function useSavedArticles() {
  const context = useContext(SavedArticlesContext);
  if (!context) throw new Error("useSavedArticles must be used inside SavedArticlesProvider");
  return context;
}
