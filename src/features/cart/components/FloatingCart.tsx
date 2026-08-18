"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ShoppingBag } from "lucide-react";
import { useCartStore } from "@/features/cart/store";

export default function FloatingCart() {
  const cart = useCartStore((state) => state.cart);

  const totalItems = cart.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  return (
    <AnimatePresence>
      {totalItems > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.6, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.6, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 22 }}
          className="fixed bottom-6 right-6 z-50"
        >
          <Link
            href="/cart"
            className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-brand-600 to-brand-700 text-white shadow-2xl shadow-brand-600/30 transition hover:scale-110"
          >
            <ShoppingBag className="h-6 w-6" />

            <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs font-bold">
              {totalItems}
            </span>
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
