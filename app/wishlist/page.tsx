"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Check, Copy, Heart, LogIn, Package, Share2, ShoppingBag, Tag, Wallet } from "lucide-react";
import { useCartStore } from "@/features/cart/store";
import { useWishlist } from "@/features/wishlist/WishlistProvider";
import ProductCard from "@/features/products/components/ProductCard";
import ProductCardSkeleton from "@/features/products/components/ProductCardSkeleton";
import { Button } from "@/components/ui/button";
import { fadeInUp, staggerContainer } from "@/lib/motion";

type WishlistItem = {
  id: string;
  productId: string;
  product: {
    id: string;
    name: string;
    price: number;
    image: string;
    description: string;
    stock: number;
  };
};

type Insights = {
  totalItems: number;
  totalValue: number;
  averagePrice: number;
  inStockCount: number;
  outOfStockCount: number;
  topCategory: string | null;
};

export default function WishlistPage() {
  const { data: session, status } = useSession();
  const { toggle } = useWishlist();
  const addToCart = useCartStore((state) => state.addToCart);

  const [items, setItems] = useState<WishlistItem[] | null>(null);
  const [insights, setInsights] = useState<Insights | null>(null);
  const [copied, setCopied] = useState(false);

  function loadWishlist() {
    fetch("/api/wishlist")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setItems(data))
      .catch(() => setItems([]));
  }

  useEffect(() => {
    if (status !== "authenticated") return;

    loadWishlist();

    fetch("/api/wishlist/insights")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setInsights(data))
      .catch(() => setInsights(null));
  }, [status]);

  async function moveToCart(item: WishlistItem) {
    addToCart({
      id: item.product.id,
      name: item.product.name,
      price: item.product.price,
      image: item.product.image,
    });

    await toggle(item.product.id);
    setItems((prev) => prev?.filter((i) => i.id !== item.id) ?? null);
    toast.success(`${item.product.name} moved to cart`);
  }

  async function shareWishlist() {
    try {
      const res = await fetch("/api/wishlist/share");
      const data = await res.json();

      const link = `${window.location.origin}/wishlist/shared/${data.token}`;

      const nav = navigator as Navigator & {
        share?: (data: { title: string; text: string; url: string }) => Promise<void>;
      };

      if (nav.share) {
        try {
          await nav.share({
            title: "My NatureCart Wishlist",
            text: "Check out my wishlist on NatureCart!",
            url: link,
          });
          return;
        } catch {
          // User dismissed the share sheet — fall through to copy.
        }
      }

      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success("Wishlist link copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not create a share link. Please try again.");
    }
  }

  if (status === "loading") {
    return (
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-7xl flex-col items-center justify-center px-6 text-center">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
          <LogIn className="h-10 w-10 text-neutral-400" />
        </div>
        <h1 className="mt-6 font-display text-3xl font-extrabold text-neutral-900 dark:text-white">
          Please log in to view your wishlist
        </h1>
        <Button asChild variant="primary" className="mt-8">
          <Link href="/login">Log In</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-brand-600">
            Saved Items
          </p>
          <h1 className="mt-2 font-display text-4xl font-extrabold text-neutral-900 dark:text-white">
            My Wishlist
          </h1>
        </div>

        {items && items.length > 0 && (
          <Button variant="outline" onClick={shareWishlist}>
            {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />} Share Wishlist
          </Button>
        )}
      </div>

      {insights && insights.totalItems > 0 && (
        <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-neutral-200/70 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-900/20">
              <Heart className="h-4 w-4" />
            </div>
            <p className="mt-3 text-xl font-bold text-neutral-900 dark:text-white">
              {insights.totalItems}
            </p>
            <p className="text-xs text-neutral-500">Items Saved</p>
          </div>

          <div className="rounded-2xl border border-neutral-200/70 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-900/20">
              <Wallet className="h-4 w-4" />
            </div>
            <p className="mt-3 text-xl font-bold text-neutral-900 dark:text-white">
              ₹{insights.totalValue}
            </p>
            <p className="text-xs text-neutral-500">Total Value (avg ₹{insights.averagePrice})</p>
          </div>

          <div className="rounded-2xl border border-neutral-200/70 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-900/20">
              <Package className="h-4 w-4" />
            </div>
            <p className="mt-3 text-xl font-bold text-neutral-900 dark:text-white">
              {insights.inStockCount}/{insights.totalItems}
            </p>
            <p className="text-xs text-neutral-500">In Stock</p>
          </div>

          <div className="rounded-2xl border border-neutral-200/70 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-700 dark:bg-brand-900/20">
              <Tag className="h-4 w-4" />
            </div>
            <p className="mt-3 truncate text-xl font-bold capitalize text-neutral-900 dark:text-white">
              {insights.topCategory ?? "—"}
            </p>
            <p className="text-xs text-neutral-500">Favorite Category</p>
          </div>
        </div>
      )}

      {items === null ? (
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-3xl border border-neutral-200/70 bg-white p-16 text-center shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <Heart className="mx-auto h-12 w-12 text-neutral-300" />
          <p className="mt-4 text-lg font-semibold text-neutral-700 dark:text-neutral-200">
            Your wishlist is empty
          </p>
          <p className="mt-2 text-neutral-500">
            Tap the heart on any product to save it here.
          </p>
        </div>
      ) : (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="grid gap-8 md:grid-cols-2 lg:grid-cols-3"
        >
          {items.map((item) => (
            <motion.div key={item.id} variants={fadeInUp} className="flex flex-col gap-3">
              <ProductCard
                product={{
                  id: item.product.id,
                  name: item.product.name,
                  price: item.product.price,
                  image: item.product.image,
                  description: item.product.description,
                }}
              />

              <Button
                variant="outline"
                className="w-full"
                disabled={item.product.stock <= 0}
                onClick={() => moveToCart(item)}
              >
                <ShoppingBag className="h-4 w-4" />
                {item.product.stock <= 0 ? "Out of Stock" : "Move To Cart"}
              </Button>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
