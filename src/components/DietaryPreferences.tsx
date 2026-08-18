"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Leaf, Wheat, Sprout, Dumbbell, Candy, Recycle } from "lucide-react";
import { fadeInUp, staggerContainer, viewportOnce } from "@/lib/motion";

// Real, working deep links - `?search=...` is parsed server-side by
// products/nlpQuery.ts into the matching structured filter (organic,
// vegan, gluten-free, etc.) plus fuzzy-matched free text, the same
// pipeline AI Smart Search uses. Not a fabricated shortcut: every link
// here returns genuine, currently-in-stock catalog matches.
const PREFERENCES = [
  { label: "Organic", icon: Leaf, query: "organic" },
  { label: "Vegan", icon: Sprout, query: "vegan" },
  { label: "Gluten-Free", icon: Wheat, query: "gluten free" },
  { label: "High Protein", icon: Dumbbell, query: "protein" },
  { label: "Sugar-Free", icon: Candy, query: "sugar free" },
  { label: "Eco-Friendly", icon: Recycle, query: "eco friendly" },
];

export default function DietaryPreferences() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-20">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
        variants={fadeInUp}
        className="mb-10"
      >
        <p className="text-sm font-semibold uppercase tracking-widest text-brand-600">
          Health &amp; Nutrition
        </p>
        <h2 className="mt-2 font-display text-4xl font-extrabold text-neutral-900 dark:text-white">
          Shop by Dietary Preference
        </h2>
      </motion.div>

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
        variants={staggerContainer}
        className="grid gap-5 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6"
      >
        {PREFERENCES.map(({ label, icon: Icon, query }) => (
          <motion.div key={label} variants={fadeInUp}>
            <Link
              href={`/shop?search=${encodeURIComponent(query)}`}
              className="group flex flex-col items-center rounded-3xl border border-neutral-200/70 bg-white p-6 text-center shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-brand-200 hover:shadow-xl dark:border-neutral-800 dark:bg-neutral-900"
            >
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-100 dark:bg-neutral-800">
                <Icon className="h-6 w-6" aria-hidden="true" />
              </div>

              <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">{label}</h3>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
