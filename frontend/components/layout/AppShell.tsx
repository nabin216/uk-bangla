"use client";
import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SavedArticlesModal from "@/components/modals/SavedArticlesModal";
import { LanguageProvider, useLanguage } from "@/context/LanguageContext";
import { SavedArticlesProvider } from "@/context/SavedArticlesContext";
import { API_URL, fetchStories } from "@/lib/api";
import type { Story } from "@/types";

function Frame({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { language } = useLanguage();
  const [dark, setDark] = useState(false);
  const [savedOpen, setSavedOpen] = useState(false);
  const [stories, setStories] = useState<Story[]>([]);

  const toggleTheme = () => {
    setDark((current) => {
      const next = !current;
      document.documentElement.classList.toggle("dark", next);
      try { window.localStorage.setItem("uk-bangla-theme", next ? "dark" : "light"); } catch {}
      return next;
    });
  };

  useEffect(() => {
    let isDark = false;
    try { isDark = window.localStorage.getItem("uk-bangla-theme") === "dark"; } catch {}
    if (!isDark) return;
    document.documentElement.classList.add("dark");
    const id = window.setTimeout(() => setDark(true), 0);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    if (!savedOpen || stories.length || !API_URL) return;
    fetchStories("?limit=100").then(setStories).catch(() => undefined);
  }, [savedOpen, stories.length]);

  useEffect(() => {
    if (!API_URL || !pathname) return;
    const slug = pathname.startsWith("/article/") ? pathname.split("/")[2] : undefined;
    fetch(`${API_URL}/api/track/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: pathname, slug }),
      keepalive: true,
    }).catch(() => undefined);
  }, [pathname]);

  return (
    <div className={language === "bn" ? "font-bengali" : undefined}>
      <div className="flex min-h-screen flex-col bg-[#f3f3f0] font-sans text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <Header onSaved={() => setSavedOpen(true)} dark={dark} onTheme={toggleTheme} />
        <div className="flex-1">{children}</div>
        <Footer />
        <SavedArticlesModal
          open={savedOpen}
          onClose={() => setSavedOpen(false)}
          stories={stories}
          onOpen={(story) => {
            setSavedOpen(false);
            router.push(`/article/${story.id}`);
          }}
        />
      </div>
    </div>
  );
}

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <LanguageProvider>
      <SavedArticlesProvider>
        <Frame>{children}</Frame>
      </SavedArticlesProvider>
    </LanguageProvider>
  );
}
