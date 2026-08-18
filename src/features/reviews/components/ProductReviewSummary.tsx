"use client";

import { useEffect, useState } from "react";
import { Loader2, Sparkles, ThumbsDown, ThumbsUp } from "lucide-react";

type ReviewSummaryData = {
  reviewCount: number;
  avgRating: number;
  sentiment: string;
  recommendationScore: number;
  pros: string[];
  cons: string[];
  aiSummary: string | null;
  source: "rule" | "llm";
};

// `reviewCount` is passed in purely to trigger a refetch when it changes
// (e.g. right after the shopper submits a new review) - the backend
// itself decides whether the cached summary is actually stale.
export default function ProductReviewSummary({
  productId,
  reviewCount,
}: {
  productId: string;
  reviewCount: number;
}) {
  const [summary, setSummary] = useState<ReviewSummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(() => {
      if (!cancelled) {
        setLoading(true);
        setError(false);
      }
    });

    fetch(`/api/products/${productId}/review-summary`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load review summary");
        return res.json();
      })
      .then((data: ReviewSummaryData) => {
        if (!cancelled) setSummary(data);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [productId, reviewCount]);

  if (loading) {
    return (
      <div className="mb-6 flex items-center gap-2 rounded-3xl border border-neutral-200/70 bg-white p-6 text-sm text-neutral-500 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        Summarizing reviews...
      </div>
    );
  }

  if (error) {
    return (
      <p className="mb-6 rounded-3xl border border-neutral-200/70 bg-white p-6 text-sm text-neutral-500 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        Couldn&apos;t load the review summary right now.
      </p>
    );
  }

  if (!summary || summary.reviewCount === 0) return null;

  return (
    <div className="mb-6 rounded-3xl border border-neutral-200/70 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-brand-600" aria-hidden="true" />
          <h3 className="font-display text-lg font-bold text-neutral-900 dark:text-white">Review Summary</h3>
        </div>

        <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
          {summary.source === "llm" ? "AI-enhanced" : "Auto-generated from reviews"}
        </span>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Overall Sentiment</p>
          <p className="mt-1 text-base font-bold text-neutral-900 dark:text-white">{summary.sentiment}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Would Recommend</p>
          <p className="mt-1 text-base font-bold text-neutral-900 dark:text-white">
            {summary.recommendationScore}%
          </p>
        </div>
      </div>

      {summary.aiSummary && (
        <p className="mb-4 text-sm text-neutral-700 dark:text-neutral-200">{summary.aiSummary}</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-400">
            <ThumbsUp className="h-3.5 w-3.5" aria-hidden="true" /> Pros
          </p>
          {summary.pros.length > 0 ? (
            <ul className="space-y-1 text-sm text-neutral-700 dark:text-neutral-200">
              {summary.pros.map((pro) => (
                <li key={pro} className="capitalize">
                  {pro}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-neutral-400">Not enough data yet.</p>
          )}
        </div>

        <div>
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-rose-600 dark:text-rose-400">
            <ThumbsDown className="h-3.5 w-3.5" aria-hidden="true" /> Cons
          </p>
          {summary.cons.length > 0 ? (
            <ul className="space-y-1 text-sm text-neutral-700 dark:text-neutral-200">
              {summary.cons.map((con) => (
                <li key={con} className="capitalize">
                  {con}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-neutral-400">No common complaints found.</p>
          )}
        </div>
      </div>
    </div>
  );
}
