"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProductReviewSummary from "@/features/reviews/components/ProductReviewSummary";

type Review = {
  id: string;
  rating: number;
  comment: string;
};

export default function ProductReviews({
  productId,
}: {
  productId: string;
}) {
  const { data: session } = useSession();

  const [reviews, setReviews] =
    useState<Review[]>([]);

  const [comment, setComment] =
    useState("");

  const [rating, setRating] =
    useState(5);

  const [submitting, setSubmitting] = useState(false);

  async function loadReviews() {
    const res = await fetch(
      `/api/reviews?productId=${productId}`
    );

    const data = await res.json();

    setReviews(data);
  }

  useEffect(() => {
    fetch(`/api/reviews?productId=${productId}`)
      .then((res) => res.json())
      .then((data) => setReviews(data));
  }, [productId]);

  async function submitReview() {
    if (!comment.trim()) {
      toast.error("Please write a comment before submitting");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          productId,
          rating,
          comment,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        toast.error(data?.error || "Could not submit review");
        return;
      }

      toast.success("Review submitted");
      setComment("");

      loadReviews();
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const average =
    reviews.length > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : 0;

  return (
    <div className="mt-20">
      <div className="mb-6 flex items-center gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-brand-600">
            Feedback
          </p>
          <h2 className="mt-2 font-display text-3xl font-extrabold text-neutral-900 dark:text-white">
            Reviews
          </h2>
        </div>

        {reviews.length > 0 && (
          <span className="ml-2 flex items-center gap-1.5 text-sm text-neutral-500">
            <span className="flex gap-0.5 text-amber-400">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-4 w-4" fill={i < Math.round(average) ? "currentColor" : "none"} />
              ))}
            </span>
            {average.toFixed(1)} &middot; {reviews.length} review{reviews.length === 1 ? "" : "s"}
          </span>
        )}
      </div>

      <ProductReviewSummary productId={productId} reviewCount={reviews.length} />

      {session ? (
        <div className="mb-6 rounded-3xl border border-neutral-200/70 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <div className="mb-3 flex gap-1">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setRating(value)}
                aria-label={`Rate ${value} stars`}
              >
                <Star
                  className="h-6 w-6 text-amber-400"
                  fill={value <= rating ? "currentColor" : "none"}
                />
              </button>
            ))}
          </div>

          <textarea
            value={comment}
            onChange={(e) =>
              setComment(e.target.value)
            }
            placeholder="Share your experience with this product..."
            rows={3}
            className="mb-3 w-full rounded-2xl border border-neutral-200 bg-white p-4 text-sm outline-none focus:border-brand-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-50"
          />

          <Button onClick={submitReview} disabled={submitting} variant="primary">
            {submitting ? "Submitting..." : "Submit Review"}
          </Button>
        </div>
      ) : (
        <p className="mb-6 rounded-3xl border border-neutral-200/70 bg-white p-6 text-neutral-500 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          Please log in to leave a review.
        </p>
      )}

      <div className="space-y-4">
        {reviews.map((review) => (
          <div
            key={review.id}
            className="rounded-3xl border border-neutral-200/70 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
          >
            <div className="mb-2 flex gap-0.5 text-amber-400">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-4 w-4" fill={i < review.rating ? "currentColor" : "none"} />
              ))}
            </div>

            <p className="text-neutral-700 dark:text-neutral-200">{review.comment}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
