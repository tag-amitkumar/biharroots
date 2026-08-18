"use client";

import { useState } from "react";
import SafeImage from "@/components/SafeImage";
import Link from "next/link";
import { toast } from "sonner";
import { Plus, ShoppingBag } from "lucide-react";
import { useCartStore } from "@/features/cart/store";

type BundleProduct = {
  id: string;
  name: string;
  price: number;
  image: string;
};

export default function FrequentlyBoughtTogether({
  baseProduct,
  companions,
}: {
  baseProduct: BundleProduct;
  companions: BundleProduct[];
}) {
  const addToCart = useCartStore((state) => state.addToCart);

  const [checked, setChecked] = useState<Set<string>>(
    () => new Set(companions.map((product) => product.id))
  );

  const allProducts = [baseProduct, ...companions];

  const total = allProducts.reduce(
    (sum, product) => (product.id === baseProduct.id || checked.has(product.id) ? sum + product.price : sum),
    0
  );

  const selectedCount = 1 + companions.filter((product) => checked.has(product.id)).length;

  function toggleCompanion(id: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function addBundleToCart() {
    addToCart({ id: baseProduct.id, name: baseProduct.name, price: baseProduct.price, image: baseProduct.image });

    companions
      .filter((product) => checked.has(product.id))
      .forEach((product) =>
        addToCart({ id: product.id, name: product.name, price: product.price, image: product.image })
      );

    toast.success(
      `${selectedCount} item${selectedCount === 1 ? "" : "s"} added to cart`
    );
  }

  return (
    <section className="mt-20">
      <p className="text-sm font-semibold uppercase tracking-widest text-brand-600">
        Bundle &amp; Save Time
      </p>
      <h2 className="mt-2 mb-6 font-display text-3xl font-extrabold text-neutral-900 dark:text-white">
        Frequently Bought Together
      </h2>

      <div className="flex flex-col gap-6 rounded-3xl border border-neutral-200/70 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 lg:flex-row lg:items-center">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          {allProducts.map((product, index) => (
            <div key={product.id} className="flex items-center gap-3">
              {index > 0 && <Plus className="h-4 w-4 shrink-0 text-neutral-300" />}

              <div className="flex flex-col items-center gap-2">
                <Link
                  href={`/product/${product.id}`}
                  className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-700"
                >
                  <SafeImage src={product.image} alt={product.name} fill sizes="80px" className="object-cover" />
                </Link>

                <label className="flex max-w-[6rem] items-start gap-1 text-center text-xs text-neutral-600 dark:text-neutral-300">
                  {product.id !== baseProduct.id && (
                    <input
                      type="checkbox"
                      checked={checked.has(product.id)}
                      onChange={() => toggleCompanion(product.id)}
                      className="mt-0.5 shrink-0 accent-brand-600"
                      aria-label={`Include ${product.name}`}
                    />
                  )}
                  <span className="line-clamp-2">{product.name}</span>
                </label>

                <span className="text-xs font-semibold text-neutral-500">₹{product.price}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="flex shrink-0 flex-col items-start gap-3 border-t border-neutral-100 pt-4 dark:border-neutral-800 lg:items-end lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
          <div>
            <p className="text-sm text-neutral-500">
              Total for {selectedCount} item{selectedCount === 1 ? "" : "s"}
            </p>
            <p className="text-2xl font-bold text-neutral-900 dark:text-white">₹{total}</p>
          </div>

          <button
            onClick={addBundleToCart}
            className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-brand-600 to-brand-700 px-6 py-3 font-bold text-white shadow-lg shadow-brand-600/20 transition hover:brightness-105 active:scale-[0.98]"
          >
            <ShoppingBag className="h-4 w-4" /> Add Selected To Cart
          </button>
        </div>
      </div>
    </section>
  );
}
