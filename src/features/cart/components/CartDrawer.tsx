"use client";

import SafeImage from "@/components/SafeImage";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useCartStore } from "@/features/cart/store";
import { useCartDrawerStore } from "@/features/cart/drawerStore";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

export default function CartDrawer() {
  const isOpen = useCartDrawerStore((state) => state.isOpen);
  const close = useCartDrawerStore((state) => state.close);

  const cart = useCartStore((state) => state.cart);
  const increaseQuantity = useCartStore((state) => state.increaseQuantity);
  const decreaseQuantity = useCartStore((state) => state.decreaseQuantity);
  const removeFromCart = useCartStore((state) => state.removeFromCart);

  const total = cart.reduce(
    (sum, item) =>
      sum + Number(item.price) * item.quantity,
    0
  );

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && close()}>
      <SheetContent side="right" className="flex flex-col p-0">
        <SheetHeader className="border-b border-neutral-200/70 dark:border-neutral-800">
          <SheetTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" /> Your Cart
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-4">
          {cart.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
                <ShoppingBag className="h-7 w-7 text-neutral-400" />
              </div>
              <p className="font-semibold text-neutral-700 dark:text-neutral-200">
                Your cart is empty
              </p>
              <Button asChild variant="primary" size="sm" className="mt-4">
                <Link href="/shop" onClick={close}>
                  Start Shopping
                </Link>
              </Button>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {cart.map((item) => (
                <motion.div
                  key={item.id + (item.variantId || "")}
                  layout
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="mb-3 flex items-center gap-3 overflow-hidden rounded-2xl border border-neutral-200/70 p-3 dark:border-neutral-800"
                >
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl">
                    <SafeImage src={item.image} alt={item.name} fill sizes="64px" className="object-cover" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-bold text-neutral-900 dark:text-white">
                      {item.name}
                      {item.variantLabel && (
                        <span className="font-normal text-neutral-400"> ({item.variantLabel})</span>
                      )}
                    </h3>

                    <p className="text-sm font-semibold text-brand-600">
                      ₹{item.price}
                    </p>

                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex items-center rounded-full border border-neutral-200 dark:border-neutral-700">
                        <button
                          onClick={() => decreaseQuantity(item.id, item.variantId)}
                          aria-label="Decrease quantity"
                          className="p-1.5 text-neutral-500 hover:text-brand-600"
                        >
                          <Minus className="h-3 w-3" />
                        </button>

                        <span className="w-6 text-center text-sm">{item.quantity}</span>

                        <button
                          onClick={() => increaseQuantity(item.id, item.variantId)}
                          aria-label="Increase quantity"
                          className="p-1.5 text-neutral-500 hover:text-brand-600"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.id, item.variantId)}
                        aria-label="Remove item"
                        className="ml-auto text-neutral-400 hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        {cart.length > 0 && (
          <div className="border-t border-neutral-200/70 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
            <div className="mb-4 flex justify-between font-bold text-neutral-900 dark:text-white">
              <span>Total</span>
              <span>₹{total}</span>
            </div>

            <Button asChild variant="primary" className="w-full">
              <Link href="/checkout" onClick={close}>
                Checkout
              </Link>
            </Button>

            <Button asChild variant="ghost" className="mt-2 w-full">
              <Link href="/cart" onClick={close}>
                View Full Cart
              </Link>
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
