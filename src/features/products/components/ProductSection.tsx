"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
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

export default function ProductSection() {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [ratings, setRatings] = useState<Rating[]>([]);

  useEffect(() => {
    Promise.all([getAllProducts(), getRatings()])
      .then(([productData, ratingData]) => {
        setProducts(productData.slice(0, 6));
        setRatings(ratingData);
      })
      .catch(() => setProducts([]));
  }, []);

  const ratingByProductId = new Map(ratings.map((r) => [r.productId, r]));

  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={fadeInUp}
          className="mb-12 flex items-end justify-between"
        >
          <div className="text-center sm:text-left">
            <p className="text-sm font-semibold uppercase tracking-widest text-brand-600">
              Fresh Organic Collection
            </p>
            <h2 className="mt-2 font-display text-4xl font-extrabold text-neutral-900 dark:text-white sm:text-5xl">
              Featured Products
            </h2>
          </div>

          <Link
            href="/shop"
            className="hidden items-center gap-1 text-sm font-semibold text-neutral-600 hover:text-brand-600 dark:text-neutral-300 sm:flex"
          >
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>

        {products === null ? (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : products.length === 0 ? (
          <p className="text-center text-neutral-500">
            No products yet. Check back soon!
          </p>
        ) : (
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            variants={staggerContainer}
            className="grid gap-8 md:grid-cols-2 lg:grid-cols-3"
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
      </div>
    </section>
  );
}
