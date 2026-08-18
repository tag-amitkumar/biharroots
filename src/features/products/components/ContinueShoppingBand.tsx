"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { RotateCcw } from "lucide-react";
import { useCartStore } from "@/features/cart/store";
import ProductCard from "./ProductCard";

type Product = {
  id: string;
  name: string;
  price: number;
  image: string;
  description: string;
};

// A returning customer's homepage isn't the same as a first-time visitor's:
// this renders right after the hero, before any generic marketing sections,
// so someone who's already shopped with us picks up where they left off
// instead of scrolling past a wall of unrelated promos first. Guests and
// brand-new customers (no view/purchase history yet) see nothing here - the
// homepage looks exactly as it always did for them.
export default function ContinueShoppingBand() {
  const { status } = useSession();
  const addToCart = useCartStore((state) => state.addToCart);

  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([]);
  const [recentlyPurchased, setRecentlyPurchased] = useState<Product[]>([]);

  useEffect(() => {
    if (status !== "authenticated") return;

    Promise.all([
      fetch("/api/recently-viewed").then((res) => res.json()),
      fetch("/api/orders/recently-purchased").then((res) => res.json()),
    ])
      .then(([viewed, purchased]: [Product[], Product[]]) => {
        setRecentlyViewed(viewed);
        setRecentlyPurchased(purchased);
      })
      .catch(() => {});
  }, [status]);

  function reorder(product: Product) {
    addToCart({ id: product.id, name: product.name, price: product.price, image: product.image });
    toast.success(`${product.name} added to cart`);
  }

  if (recentlyViewed.length === 0 && recentlyPurchased.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-6 py-16">
      {recentlyPurchased.length > 0 && (
        <div className="mb-16">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-brand-600">
                Welcome Back
              </p>
              <h2 className="mt-2 font-display text-4xl font-extrabold text-neutral-900 dark:text-white">
                Buy It Again
              </h2>
            </div>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {recentlyPurchased.slice(0, 4).map((product) => (
              <div key={product.id} className="flex flex-col gap-3">
                <ProductCard product={product} />
                <button
                  onClick={() => reorder(product)}
                  className="flex items-center justify-center gap-2 rounded-2xl border border-neutral-200 py-2.5 text-sm font-semibold text-neutral-700 transition-colors hover:border-brand-200 hover:text-brand-600 dark:border-neutral-700 dark:text-neutral-200"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Buy Again
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {recentlyViewed.length > 0 && (
        <div>
          <div className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-widest text-brand-600">
              Pick Up Where You Left Off
            </p>
            <h2 className="mt-2 font-display text-4xl font-extrabold text-neutral-900 dark:text-white">
              Continue Shopping
            </h2>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {recentlyViewed.slice(0, 4).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
