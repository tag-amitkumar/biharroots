"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Quote, Star } from "lucide-react";
import { fadeInUp, staggerContainer, viewportOnce } from "@/lib/motion";

type FeaturedReview = {
  id: string;
  rating: number;
  comment: string;
  customerName: string;
  productName: string;
};

export default function CustomerReviews() {
  const [reviews, setReviews] = useState<FeaturedReview[] | null>(null);

  useEffect(() => {
    fetch("/api/reviews/featured?limit=6")
      .then((res) => res.json())
      .then(setReviews)
      .catch(() => setReviews([]));
  }, []);

  if (reviews !== null && reviews.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-6 py-20">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
        variants={fadeInUp}
        className="mb-10 text-center"
      >
        <p className="text-sm font-semibold uppercase tracking-widest text-brand-600">
          Testimonials
        </p>
        <h2 className="mt-2 font-display text-4xl font-extrabold text-neutral-900 dark:text-white">
          Loved by Our Customers
        </h2>
      </motion.div>

      {reviews === null ? (
        <div className="grid gap-6 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-48 animate-pulse rounded-3xl bg-neutral-200 dark:bg-neutral-800" />
          ))}
        </div>
      ) : (
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={staggerContainer}
          className="grid gap-6 md:grid-cols-3"
        >
          {reviews.map((review) => (
            <motion.div
              key={review.id}
              variants={fadeInUp}
              className="flex flex-col rounded-3xl border border-neutral-200/70 bg-white p-7 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
            >
              <Quote className="h-6 w-6 text-brand-300" />

              <div className="mt-3 flex gap-0.5 text-amber-400">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className="h-4 w-4"
                    fill={i < review.rating ? "currentColor" : "none"}
                  />
                ))}
              </div>

              <p className="mt-4 flex-1 text-neutral-600 dark:text-neutral-300">
                &ldquo;{review.comment}&rdquo;
              </p>

              <div className="mt-6 border-t border-neutral-100 pt-4 dark:border-neutral-800">
                <p className="font-semibold text-neutral-900 dark:text-white">
                  {review.customerName}
                </p>
                <p className="text-sm text-neutral-400">
                  on {review.productName}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </section>
  );
}
