"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
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

export default function TrendingProducts() {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [ratings, setRatings] = useState<Rating[]>([]);

  useEffect(() => {
    Promise.all([
      fetch("/api/recommendations/trending")
        .then((res) => res.json())
        .then((data: Product[]) => data.slice(0, 4)),
      getRatings(),
    ])
      .then(([productData, ratingData]) => {
        setProducts(productData);
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
          <p className="text-sm font-semibold uppercase tracking-widest text-brand-600">
            Just In
          </p>
          <h2 className="mt-2 font-display text-4xl font-extrabold text-neutral-900 dark:text-white">
            Trending Now
          </h2>
        </div>

        <Link
          href="/shop?sort=newest"
          className="hidden items-center gap-1 text-sm font-semibold text-neutral-600 hover:text-brand-600 dark:text-neutral-300 sm:flex"
        >
          View all <ArrowRight className="h-4 w-4" />
        </Link>
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
