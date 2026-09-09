"use client";
import { useEffect, useState, type FormEvent } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { API_URL, fetchComments, postComment } from "@/lib/api";
import type { ArticleComment } from "@/types";

function initialOf(name: string) {
  return (name.trim()[0] || "?").toUpperCase();
}

export default function CommentSection({ slug, initialCount = 0 }: { slug: string; initialCount?: number }) {
  const { language, t } = useLanguage();
  const [comments, setComments] = useState<ArticleComment[]>([]);
  const [loading, setLoading] = useState(Boolean(API_URL));
  const [name, setName] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!API_URL) return;
    let alive = true;
    fetchComments(slug)
      .then((rows) => { if (alive) setComments(rows); })
      .catch(() => undefined)
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [slug]);

  const count = comments.length || initialCount;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const created = await postComment(slug, { name: name.trim(), body: body.trim() });
      setComments((current) => [created, ...current]);
      setName("");
      setBody("");
      setDone(true);
      window.setTimeout(() => setDone(false), 3000);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not post comment.");
    } finally {
      setBusy(false);
    }
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(language === "bn" ? "bn-BD" : "en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  return (
    <section className="mt-14 border-t border-slate-300 pt-8 dark:border-slate-800">
      <h2 className="font-serif text-xl font-black">
        {t("responses")} {count > 0 && <span className="text-slate-400">({count})</span>}
      </h2>

      <form onSubmit={submit} className="mt-5 grid gap-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={80}
          placeholder={t("yourName")}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#0f2f57] dark:border-slate-700 dark:bg-slate-900 dark:focus:border-amber-400"
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          required
          maxLength={2000}
          rows={3}
          placeholder={t("yourComment")}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#0f2f57] dark:border-slate-700 dark:bg-slate-900 dark:focus:border-amber-400"
        />
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={busy}
            className="rounded-full bg-[#0f2f57] px-5 py-2 text-xs font-bold uppercase tracking-[0.12em] text-white transition hover:bg-[#0b2444] disabled:opacity-60 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
          >
            {busy ? t("posting") : t("postComment")}
          </button>
          {done && <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">{t("commentPosted")}</span>}
          {error && <span className="text-xs font-semibold text-red-600 dark:text-red-400">{error}</span>}
        </div>
      </form>

      <div className="mt-8 space-y-6">
        {loading && <p className="text-sm text-slate-500">{t("commentsLoading")}</p>}
        {!loading && comments.length === 0 && <p className="text-sm text-slate-500">{t("noComments")}</p>}
        {comments.map((comment) => (
          <article key={comment.id} className="flex gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-200 text-sm font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              {initialOf(comment.name)}
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-baseline gap-x-2">
                <span className="font-semibold">{comment.name}</span>
                <span className="text-xs text-slate-400">{formatDate(comment.date)}</span>
              </div>
              <p className="mt-1 whitespace-pre-line text-[0.95rem] leading-relaxed text-slate-700 dark:text-slate-300">
                {comment.body}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
