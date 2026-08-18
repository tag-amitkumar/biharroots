"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Eye, GitCompare, Heart, ShoppingBag, Star } from "lucide-react";
import { useCartStore } from "@/features/cart/store";
import { useWishlist } from "@/features/wishlist/WishlistProvider";
import { useCompareStore, MAX_COMPARE } from "@/features/products/compareStore";
import { Badge } from "@/components/ui/badge";
import SafeImage from "@/components/SafeImage";
import { cn } from "@/lib/utils";
import ProductQuickView from "./ProductQuickView";

type ProductProps = {
  product: {
    id: string;
    name: string;
    price: number;
    image: string;
    description?: string;
    rating?: number;
    reviewCount?: number;
    oldPrice?: number;
  };
  layout?: "grid" | "list";
};

export default function ProductCard({
  product,
  layout = "grid",
}: ProductProps) {
  const { data: session } = useSession();
  const { productIds, toggle } = useWishlist();
  const [quickViewOpen, setQuickViewOpen] = useState(false);

  const compareIds = useCompareStore((state) => state.productIds);
  const toggleCompare = useCompareStore((state) => state.toggle);

  const isWishlisted = productIds.has(product.id);
  const isComparing = compareIds.includes(product.id);
  const hasRating = typeof product.rating === "number" && (product.reviewCount ?? 0) > 0;

  function handleToggleCompare() {
    if (!isComparing && compareIds.length >= MAX_COMPARE) {
      toast.error(`You can compare up to ${MAX_COMPARE} products at a time`);
      return;
    }

    toggleCompare(product.id);
  }

  const addToCart = useCartStore(
    (state) => state.addToCart
  );

  function handleAddToCart() {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
    });

    toast.success(`${product.name} added to cart`);
  }

  const isList = layout === "list";

  return (
    <motion.div
      whileHover={{ y: isList ? 0 : -8 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className={cn(
        "group overflow-hidden rounded-[28px] border border-neutral-200/70 bg-white shadow-sm transition-shadow duration-500 hover:shadow-2xl dark:border-neutral-800 dark:bg-neutral-900",
        isList && "flex flex-col sm:flex-row"
      )}
    >
      <div
        className={cn(
          "relative overflow-hidden",
          isList ? "h-56 sm:h-full sm:w-64 sm:shrink-0" : "h-72"
        )}
      >
        <Link href={`/product/${product.id}`} className="relative block h-full w-full">
          <SafeImage
            src={product.image}
            alt={product.name}
            fill
            sizes="(min-width: 1024px) 320px, (min-width: 640px) 45vw, 90vw"
            className="object-cover transition duration-700 group-hover:scale-110"
          />
        </Link>

        {product.oldPrice && product.oldPrice > product.price && (
          <Badge variant="destructive" className="absolute left-4 top-4 shadow">
            Sale
          </Badge>
        )}

        <button
          onClick={async () => {
            if (!session) {
              toast.error("Please log in to use the wishlist");
              return;
            }

            try {
              await toggle(product.id);
              toast.success(
                isWishlisted ? "Removed from wishlist" : "Added to wishlist"
              );
            } catch {
              toast.error("Something went wrong. Please try again.");
            }
          }}
          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          className={cn(
            "absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow backdrop-blur transition-colors dark:bg-neutral-800/90",
            isWishlisted ? "text-red-500" : "text-neutral-500"
          )}
        >
          <Heart className="h-4 w-4" fill={isWishlisted ? "currentColor" : "none"} />
        </button>

        {!isList && (
          <button
            onClick={() => setQuickViewOpen(true)}
            className="absolute inset-x-4 bottom-4 flex translate-y-4 items-center justify-center gap-2 rounded-2xl bg-white/95 py-3 text-sm font-bold text-neutral-900 opacity-0 shadow-lg backdrop-blur transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 dark:bg-neutral-900/95 dark:text-white"
          >
            <Eye className="h-4 w-4" /> Quick View
          </button>
        )}
      </div>

      <div className={cn("p-6", isList && "flex flex-1 flex-col justify-center")}>
        <div className="mb-3 flex items-center gap-2">
          {hasRating ? (
            <>
              <span className="flex items-center gap-0.5 text-amber-400">
                <Star className="h-4 w-4 fill-current" />
              </span>
              <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">
                {product.rating!.toFixed(1)}
              </span>
              <span className="text-sm text-neutral-400">
                ({product.reviewCount})
              </span>
            </>
          ) : (
            <Badge variant="secondary">New</Badge>
          )}
        </div>

        <Link href={`/product/${product.id}`}>
          <h3 className="text-xl font-bold text-neutral-900 transition-colors hover:text-brand-600 dark:text-white">
            {product.name}
          </h3>
        </Link>

        {isList && product.description && (
          <p className="mt-2 line-clamp-2 text-sm text-neutral-500 dark:text-neutral-400">
            {product.description}
          </p>
        )}

        <div className="mt-3 flex items-center gap-3">
          <span className="text-2xl font-bold text-neutral-900 dark:text-white">
            ₹{product.price}
          </span>

          {product.oldPrice && product.oldPrice > product.price && (
            <span className="text-base text-neutral-400 line-through">
              ₹{product.oldPrice}
            </span>
          )}
        </div>

        <div className={cn(isList && "flex items-center gap-4")}>
          <button
            onClick={handleAddToCart}
            className={cn(
              "mt-5 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-600 to-brand-700 py-3.5 font-bold text-white shadow-lg shadow-brand-600/20 transition hover:brightness-105 active:scale-[0.98]",
              isList ? "px-8" : "w-full"
            )}
          >
            <ShoppingBag className="h-4 w-4" /> Add To Cart
          </button>

          <label className="mt-3 flex items-center gap-2 text-xs font-medium text-neutral-500 dark:text-neutral-400">
            <input
              type="checkbox"
              checked={isComparing}
              onChange={handleToggleCompare}
              className="h-3.5 w-3.5 rounded"
            />
            <GitCompare className="h-3.5 w-3.5" /> Add to Compare
          </label>
        </div>
      </div>

      {quickViewOpen && (
        <ProductQuickView
          product={product}
          onClose={() => setQuickViewOpen(false)}
          onAddToCart={() => {
            handleAddToCart();
            setQuickViewOpen(false);
          }}
        />
      )}
    </motion.div>
  );
}
