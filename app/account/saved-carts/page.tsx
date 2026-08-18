"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ShoppingBag, Trash2 } from "lucide-react";
import { useCartStore } from "@/features/cart/store";
import { Button } from "@/components/ui/button";

type SavedCart = {
  id: string;
  name: string;
  createdAt: string;
  items: {
    id: string;
    name: string;
    price: number;
    image: string;
    quantity: number;
    variantId?: string;
    variantLabel?: string;
  }[];
};

export default function SavedCartsPage() {
  const [savedCarts, setSavedCarts] = useState<SavedCart[] | null>(null);
  const addToCart = useCartStore((state) => state.addToCart);

  function loadSavedCarts() {
    fetch("/api/account/saved-carts")
      .then((res) => res.json())
      .then((data) => setSavedCarts(data))
      .catch(() => setSavedCarts([]));
  }

  useEffect(() => {
    loadSavedCarts();
  }, []);

  async function removeSavedCart(id: string) {
    await fetch(`/api/account/saved-carts/${id}`, { method: "DELETE" });
    toast.success("Saved cart removed");
    loadSavedCarts();
  }

  function restoreCart(cart: SavedCart) {
    cart.items.forEach((item) => addToCart(item));
    toast.success(`"${cart.name}" restored to your cart`);
  }

  return (
    <div className="rounded-3xl border border-neutral-200/70 bg-white p-8 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <h2 className="mb-2 text-2xl font-bold text-neutral-900 dark:text-white">Saved Carts</h2>

      <p className="mb-6 text-sm text-neutral-500">
        Save your current cart from the{" "}
        <Link href="/cart" className="font-semibold text-brand-600 hover:underline">
          cart page
        </Link>{" "}
        to come back to it later.
      </p>

      {savedCarts === null ? (
        <p className="text-neutral-500">Loading...</p>
      ) : savedCarts.length === 0 ? (
        <div className="py-10 text-center">
          <ShoppingBag className="mx-auto h-10 w-10 text-neutral-300" />
          <p className="mt-3 text-neutral-500">No saved carts yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {savedCarts.map((cart) => (
            <div
              key={cart.id}
              className="flex items-center justify-between rounded-2xl border border-neutral-200/70 p-4 dark:border-neutral-800"
            >
              <div>
                <p className="font-bold text-neutral-900 dark:text-white">{cart.name}</p>
                <p className="text-sm text-neutral-500">
                  {cart.items.length} item{cart.items.length === 1 ? "" : "s"} &middot;{" "}
                  {new Date(cart.createdAt).toLocaleDateString()}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button size="sm" variant="primary" onClick={() => restoreCart(cart)}>
                  Restore to Cart
                </Button>

                <button
                  onClick={() => removeSavedCart(cart.id)}
                  aria-label="Delete saved cart"
                  className="rounded-full p-2 text-neutral-400 hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
