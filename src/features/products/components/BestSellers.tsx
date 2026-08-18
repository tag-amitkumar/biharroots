"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { fadeInUp, staggerContainer, viewportOnce } from "@/lib/motion";
import { getAllProducts, getRatings } from "@/features/products/productsCache";
import ProductCard from "./ProductCard";
import ProductCardSkeleton from "./ProductCardSkeleton";

type Product = {
  id: string;
  name: string;
  price: number;
  image: string;
  description: string;
};

type Rating = { productId: string; avgRating: number; reviewCount: number };

export default function BestSellers() {
  const [products, setProducts] = useState<
    (Product & { rating?: number; reviewCount?: number })[] | null
  >(null);

  useEffect(() => {
    Promise.all([getAllProducts(), getRatings()])
      .then(([productData, ratingData]: [Product[], Rating[]]) => {
        const ratingByProductId = new Map(
          ratingData.map((r) => [r.productId, r])
        );

        // Real customer ratings decide "best sellers" here - a product needs
        // at least one real review to qualify, ranked by average rating.
        const rated = productData
          .map((product) => ({
            ...product,
            rating: ratingByProductId.get(product.id)?.avgRating,
            reviewCount: ratingByProductId.get(product.id)?.reviewCount,
          }))
          .filter((product) => (product.reviewCount ?? 0) > 0)
          .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));

        setProducts(rated.slice(0, 4));
      })
      .catch(() => setProducts([]));
  }, []);

  if (products !== null && products.length === 0) return null;

  return (
    <section className="bg-neutral-50 py-20 dark:bg-neutral-900/40">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={fadeInUp}
          className="mb-10"
        >
          <p className="text-sm font-semibold uppercase tracking-widest text-brand-600">
            Customer Favorites
          </p>
          <h2 className="mt-2 font-display text-4xl font-extrabold text-neutral-900 dark:text-white">
            Best Sellers
          </h2>
        </motion.div>

        {products === null ? (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            variants={staggerContainer}
            className="grid gap-8 md:grid-cols-2 lg:grid-cols-4"
          >
            {products.map((product) => (
              <motion.div key={product.id} variants={fadeInUp}>
                <ProductCard product={product} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </section>
  );
}
