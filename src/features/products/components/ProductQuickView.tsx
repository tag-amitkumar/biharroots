"use client";

import { useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import SafeImage from "@/components/SafeImage";

type Product = {
  id: string;
  name: string;
  price: number;
  image: string;
  description?: string;
  oldPrice?: number;
};

export default function ProductQuickView({
  product,
  onClose,
  onAddToCart,
}: {
  product: Product;
  onClose: () => void;
  onAddToCart: () => void;
}) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 12 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="grid w-full max-w-3xl gap-6 rounded-[32px] border border-neutral-200/70 bg-white p-6 shadow-2xl dark:border-neutral-800 dark:bg-neutral-900 md:grid-cols-2 md:p-8"
      >
        <div className="relative h-64 w-full overflow-hidden rounded-3xl md:h-full">
          <SafeImage
            src={product.image}
            alt={product.name}
            fill
            sizes="(min-width: 768px) 40vw, 90vw"
            className="object-cover"
          />
        </div>

        <div className="flex flex-col">
          <button
            onClick={onClose}
            aria-label="Close quick view"
            className="ml-auto rounded-full p-2 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
          >
            <X className="h-5 w-5" />
          </button>

          <h2 className="font-display text-3xl font-bold text-neutral-900 dark:text-white">
            {product.name}
          </h2>

          {product.description && (
            <p className="mt-4 text-neutral-500 dark:text-neutral-400">{product.description}</p>
          )}

          <div className="mt-6 flex items-center gap-3">
            <span className="text-3xl font-bold text-neutral-900 dark:text-white">
              ₹{product.price}
            </span>

            {product.oldPrice && product.oldPrice > product.price && (
              <span className="text-lg text-neutral-400 line-through">
                ₹{product.oldPrice}
              </span>
            )}
          </div>

          <button
            onClick={onAddToCart}
            className="mt-8 w-full rounded-2xl bg-gradient-to-r from-brand-600 to-brand-700 py-4 font-bold text-white shadow-lg shadow-brand-600/20 transition hover:brightness-105 active:scale-[0.98]"
          >
            Add To Cart
          </button>

          <Link
            href={`/product/${product.id}`}
            onClick={onClose}
            className="mt-4 text-center text-sm font-semibold text-brand-700 hover:underline dark:text-brand-400"
          >
            View Full Details
          </Link>
        </div>
      </motion.div>
    </motion.div>
  );
}
