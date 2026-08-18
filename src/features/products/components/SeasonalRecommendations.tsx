"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Leaf } from "lucide-react";
import { fadeInUp, staggerContainer, viewportOnce } from "@/lib/motion";
import { getRatings } from "@/features/products/productsCache";
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

export default function SeasonalRecommendations() {
  const [label, setLabel] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[] | null>(null);
  const [ratings, setRatings] = useState<Rating[]>([]);

  useEffect(() => {
    Promise.all([
      fetch("/api/recommendations/seasonal").then((res) => res.json()),
      getRatings(),
    ])
      .then(([data, ratingData]: [{ label: string; products: Product[] }, Rating[]]) => {
        setLabel(data.label);
        setProducts(data.products);
        setRatings(ratingData);
      })
      .catch(() => setProducts([]));
  }, []);

  const ratingByProductId = new Map(ratings.map((r) => [r.productId, r]));

  if (products !== null && products.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-6 py-20">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
        variants={fadeInUp}
        className="mb-10 flex items-end justify-between"
      >
        <div>
          <p className="flex items-center gap-1.5 text-sm font-semibold uppercase tracking-widest text-brand-600">
            <Leaf className="h-4 w-4" aria-hidden="true" /> Right For This Season
          </p>
          <h2 className="mt-2 font-display text-4xl font-extrabold text-neutral-900 dark:text-white">
            {label ?? "Seasonal Picks"}
          </h2>
        </div>
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
          {products.map((product) => {
            const rating = ratingByProductId.get(product.id);

            return (
              <motion.div key={product.id} variants={fadeInUp}>
                <ProductCard
                  product={{
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    image: product.image,
                    description: product.description,
                    rating: rating?.avgRating,
                    reviewCount: rating?.reviewCount,
                  }}
                />
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </section>
  );
}
