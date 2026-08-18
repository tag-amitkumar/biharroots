"use client";

import { useEffect, useState } from "react";
import SafeImage from "@/components/SafeImage";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { fadeInUp, staggerContainer, viewportOnce } from "@/lib/motion";
import { getAllProducts } from "@/features/products/productsCache";

type Product = {
  id: string;
  name: string;
  image: string;
  category: string;
};

type Collection = {
  category: string;
  image: string;
  count: number;
};

export default function FeaturedCollections() {
  const [collections, setCollections] = useState<Collection[] | null>(null);

  useEffect(() => {
    getAllProducts()
      .then((data: Product[]) => {
        const byCategory = new Map<string, Collection>();

        data.forEach((product) => {
          if (!product.category) return;

          const existing = byCategory.get(product.category);

          if (existing) {
            existing.count += 1;
          } else {
            byCategory.set(product.category, {
              category: product.category,
              image: product.image,
              count: 1,
            });
          }
        });

        setCollections(
          Array.from(byCategory.values())
            .sort((a, b) => b.count - a.count)
            .slice(0, 3)
        );
      })
      .catch(() => setCollections([]));
  }, []);

  if (collections !== null && collections.length === 0) return null;

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
          Curated
        </p>
        <h2 className="mt-2 font-display text-4xl font-extrabold text-neutral-900 dark:text-white">
          Featured Collections
        </h2>
      </motion.div>

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
        variants={staggerContainer}
        className="grid gap-6 lg:grid-cols-3"
      >
        {collections === null
          ? Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-80 animate-pulse rounded-[32px] bg-neutral-200 dark:bg-neutral-800"
              />
            ))
          : collections.map((collection) => (
              <motion.div key={collection.category} variants={fadeInUp}>
                <Link
                  href={`/shop?category=${encodeURIComponent(collection.category)}`}
                  className="group relative block h-80 overflow-hidden rounded-[32px] shadow-lg"
                >
                  <SafeImage
                    src={collection.image}
                    alt={collection.category}
                    fill
                    sizes="(min-width: 1024px) 33vw, 100vw"
                    className="object-cover transition duration-700 group-hover:scale-110"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                  <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-7">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-white/70">
                        {collection.count} products
                      </p>
                      <h3 className="mt-1 font-display text-2xl font-bold capitalize text-white">
                        {collection.category}
                      </h3>
                    </div>

                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-neutral-900 transition-transform group-hover:rotate-45">
                      <ArrowUpRight className="h-5 w-5" />
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
      </motion.div>
    </section>
  );
}
