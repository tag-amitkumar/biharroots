"use client";

import { useEffect, useState } from "react";
import SafeImage from "@/components/SafeImage";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";
import { Bookmark, Minus, Plus, ShoppingBag, Trash2, Truck } from "lucide-react";
import { useCartStore } from "@/features/cart/store";
import { FREE_EXPRESS_SHIPPING_THRESHOLD } from "@/features/orders/shipping";
import ProductCard from "@/features/products/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { fadeInUp, staggerContainer } from "@/lib/motion";

type CrossSellProduct = {
  id: string;
  name: string;
  price: number;
  image: string;
  description: string;
};

export default function CartPage() {
  const { data: session } = useSession();

  const {
    cart,
    savedForLater,
    removeFromCart,
    increaseQuantity,
    decreaseQuantity,
    saveForLater,
    moveToCart,
    removeSavedForLater,
  } = useCartStore();

  const [crossSell, setCrossSell] = useState<CrossSellProduct[]>([]);

  useEffect(() => {
    const cartProductIds = [...new Set(cart.map((item) => item.id))];

    if (cartProductIds.length === 0) {
      Promise.resolve().then(() => setCrossSell([]));
      return;
    }

    fetch(`/api/recommendations/cart-cross-sell?ids=${cartProductIds.join(",")}`)
      .then((res) => res.json())
      .then((data: CrossSellProduct[]) => setCrossSell(data))
      .catch(() => setCrossSell([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart.map((item) => item.id).join(",")]);

  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [cartName, setCartName] = useState("");
  const [saving, setSaving] = useState(false);

  function openSaveDialog() {
    if (!session) {
      toast.error("Please log in to save your cart");
      return;
    }

    setSaveDialogOpen(true);
  }

  async function saveEntireCartForLater(e: React.FormEvent) {
    e.preventDefault();

    if (!cartName.trim()) return;

    setSaving(true);

    try {
      const res = await fetch("/api/account/saved-carts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: cartName, items: cart }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        toast.error(data?.error || "Could not save cart");
        return;
      }

      toast.success("Cart saved — find it under Account > Saved Carts");
      setSaveDialogOpen(false);
      setCartName("");
    } finally {
      setSaving(false);
    }
  }

  const subtotal = cart.reduce((total, item) => {
    const price = (item.price);
    return total + price * item.quantity;
  }, 0);

  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + 3);

  const amountToFreeExpress = Math.max(0, FREE_EXPRESS_SHIPPING_THRESHOLD - subtotal);
  const freeExpressProgress = Math.min(
    100,
    (subtotal / FREE_EXPRESS_SHIPPING_THRESHOLD) * 100
  );

  if (cart.length === 0 && savedForLater.length === 0) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-7xl flex-col items-center justify-center px-6 text-center">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
          <ShoppingBag className="h-10 w-10 text-neutral-400" />
        </div>
        <h1 className="mt-6 font-display text-3xl font-extrabold text-neutral-900 dark:text-white">
          Your cart is empty
        </h1>
        <p className="mt-2 text-neutral-500">
          Looks like you haven&apos;t added anything yet.
        </p>
        <Button asChild variant="primary" className="mt-8">
          <Link href="/shop">Start Shopping</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-16">
      <h1 className="mb-10 font-display text-4xl font-extrabold text-neutral-900 dark:text-white sm:text-5xl">
        Shopping Cart
      </h1>

      <div className="grid gap-8 lg:grid-cols-3">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="space-y-4 lg:col-span-2"
        >
          {cart.length === 0 && (
            <div className="rounded-3xl border border-dashed border-neutral-300 p-8 text-center text-neutral-500 dark:border-neutral-700">
              Your cart is empty — move something back from Saved For Later below, or{" "}
              <Link href="/shop" className="font-semibold text-brand-600 hover:underline">
                keep shopping
              </Link>
              .
            </div>
          )}

          <AnimatePresence initial={false}>
            {cart.map((item) => (
              <motion.div
                key={item.id + (item.variantId || "")}
                layout
                variants={fadeInUp}
                exit={{ opacity: 0, x: -24 }}
                className="flex items-center gap-6 rounded-3xl border border-neutral-200/70 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
              >
                <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-2xl">
                  <SafeImage src={item.image} alt={item.name} fill sizes="112px" className="object-cover" />
                </div>

                <div className="flex-1">
                  <h3 className="text-xl font-bold text-neutral-900 dark:text-white">
                    {item.name}
                    {item.variantLabel && (
                      <span className="font-normal text-neutral-400"> ({item.variantLabel})</span>
                    )}
                  </h3>

                  <p className="mt-1 font-semibold text-brand-600">
                    ₹{item.price}
                  </p>

                  <div className="mt-4 flex items-center gap-3">
                    <div className="flex items-center rounded-full border border-neutral-200 dark:border-neutral-700">
                      <button
                        onClick={() => decreaseQuantity(item.id, item.variantId)}
                        aria-label="Decrease quantity"
                        className="p-2 text-neutral-500 hover:text-brand-600"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>

                      <span className="w-8 text-center font-semibold text-neutral-900 dark:text-white">
                        {item.quantity}
                      </span>

                      <button
                        onClick={() => increaseQuantity(item.id, item.variantId)}
                        aria-label="Increase quantity"
                        className="p-2 text-neutral-500 hover:text-brand-600"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-stretch gap-2">
                  <button
                    onClick={() => saveForLater(item.id, item.variantId)}
                    aria-label="Save for later"
                    className="flex items-center gap-2 rounded-xl border border-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-500 transition-colors hover:border-brand-200 hover:text-brand-600 dark:border-neutral-700"
                  >
                    <Bookmark className="h-4 w-4" /> Save For Later
                  </button>

                  <button
                    onClick={() => removeFromCart(item.id, item.variantId)}
                    aria-label="Remove item"
                    className="flex items-center gap-2 rounded-xl border border-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-500 transition-colors hover:border-red-200 hover:text-red-500 dark:border-neutral-700"
                  >
                    <Trash2 className="h-4 w-4" /> Remove
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {savedForLater.length > 0 && (
            <div className="pt-6">
              <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-neutral-900 dark:text-white">
                <Bookmark className="h-5 w-5 text-brand-600" /> Saved For Later ({savedForLater.length})
              </h2>

              <div className="space-y-4">
                {savedForLater.map((item) => (
                  <div
                    key={item.id + (item.variantId || "")}
                    className="flex items-center gap-6 rounded-3xl border border-neutral-200/70 bg-neutral-50/60 p-6 dark:border-neutral-800 dark:bg-neutral-900/40"
                  >
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl">
                      <SafeImage src={item.image} alt={item.name} fill sizes="80px" className="object-cover" />
                    </div>

                    <div className="flex-1">
                      <h3 className="font-bold text-neutral-900 dark:text-white">
                        {item.name}
                        {item.variantLabel && (
                          <span className="font-normal text-neutral-400"> ({item.variantLabel})</span>
                        )}
                      </h3>
                      <p className="mt-1 font-semibold text-brand-600">₹{item.price}</p>
                    </div>

                    <div className="flex flex-col items-stretch gap-2">
                      <button
                        onClick={() => moveToCart(item.id, item.variantId)}
                        className="rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 px-4 py-2 text-sm font-bold text-white"
                      >
                        Move To Cart
                      </button>

                      <button
                        onClick={() => removeSavedForLater(item.id, item.variantId)}
                        aria-label="Remove saved item"
                        className="flex items-center justify-center gap-2 rounded-xl border border-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-500 transition-colors hover:border-red-200 hover:text-red-500 dark:border-neutral-700"
                      >
                        <Trash2 className="h-4 w-4" /> Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {crossSell.length > 0 && (
            <div className="pt-10">
              <h2 className="mb-4 text-xl font-bold text-neutral-900 dark:text-white">
                You Might Also Want
              </h2>

              <div className="grid gap-6 sm:grid-cols-2">
                {crossSell.map((product) => (
                  <ProductCard key={product.id} product={product} layout="list" />
                ))}
              </div>
            </div>
          )}
        </motion.div>

        <div className="h-fit rounded-3xl border border-neutral-200/70 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <h2 className="mb-6 text-2xl font-bold text-neutral-900 dark:text-white">
            Order Summary
          </h2>

          <div className="space-y-4">
            <div className="flex justify-between text-neutral-600 dark:text-neutral-300">
              <span>Subtotal</span>
              <span className="font-semibold text-neutral-900 dark:text-white">₹{subtotal}</span>
            </div>

            <p className="flex items-center gap-2 text-sm text-neutral-400">
              <Truck className="h-4 w-4" /> Shipping &amp; taxes calculated at checkout
            </p>

            {cart.length > 0 && (
              <div className="rounded-2xl bg-neutral-50 p-4 dark:bg-neutral-800/50">
                {amountToFreeExpress > 0 ? (
                  <p className="text-sm text-neutral-600 dark:text-neutral-300">
                    Add <span className="font-bold text-brand-600">₹{amountToFreeExpress}</span> more for{" "}
                    <span className="font-semibold">free Express Delivery</span>
                  </p>
                ) : (
                  <p className="text-sm font-semibold text-brand-600">
                    🎉 You&apos;ve unlocked free Express Delivery!
                  </p>
                )}

                <div className="mt-2 h-2 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-brand-600 to-brand-700 transition-all duration-500"
                    style={{ width: `${freeExpressProgress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="border-t border-neutral-200 pt-4 dark:border-neutral-800">
              <p className="text-sm text-neutral-500">
                Estimated delivery by{" "}
                <span className="font-semibold text-neutral-700 dark:text-neutral-200">
                  {deliveryDate.toLocaleDateString(undefined, {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </p>
            </div>
          </div>

          <Button asChild variant="primary" className="mt-8 w-full">
            <Link href="/checkout">Proceed To Checkout</Link>
          </Button>

          <Button variant="outline" className="mt-3 w-full" onClick={openSaveDialog}>
            Save Entire Cart For Later
          </Button>
        </div>
      </div>

      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent>
          <form onSubmit={saveEntireCartForLater}>
            <DialogHeader>
              <DialogTitle>Save entire cart for later</DialogTitle>
            </DialogHeader>

            <Input
              autoFocus
              required
              placeholder='e.g. "Weekly groceries"'
              value={cartName}
              onChange={(e) => setCartName(e.target.value)}
              className="mt-4"
            />

            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setSaveDialogOpen(false)}
              >
                Cancel
              </Button>

              <Button type="submit" variant="primary" disabled={saving}>
                {saving ? "Saving..." : "Save Cart"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
