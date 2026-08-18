"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { fadeInUp, staggerContainer, viewportOnce } from "@/lib/motion";
import CategoryCard from "@/features/categories/components/CategoryCard";

type Category = {
  id: string;
  name: string;
  slug: string;
  icon: string;
  banner: string;
  showOnHomepage: boolean;
};

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data: Category[]) =>
        setCategories(Array.isArray(data) ? data.filter((c) => c.showOnHomepage) : [])
      )
      .catch(() => setCategories([]));
  }, []);

  if (categories.length === 0) return null;

  return (
    <section id="categories" className="mx-auto max-w-7xl px-6 py-20">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
        variants={fadeInUp}
        className="mb-10 flex items-end justify-between"
      >
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-brand-600">
            Browse
          </p>
          <h2 className="mt-2 font-display text-4xl font-extrabold text-neutral-900 dark:text-white">
            Shop by Category
          </h2>
        </div>
      </motion.div>

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
        variants={staggerContainer}
        className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6"
      >
        {categories.map((category) => (
          <motion.div key={category.id} variants={fadeInUp}>
            <CategoryCard category={category} />
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
