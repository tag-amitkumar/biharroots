"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRecentlyViewedStore } from "@/features/products/recentlyViewedStore";
import ProductCard from "./ProductCard";

type Product = {
  id: string;
  name: string;
  price: number;
  image: string;
  description: string;
};

export default function RecentlyViewed({
  excludeId,
}: {
  excludeId?: string;
}) {
  const { status } = useSession();
  const productIds = useRecentlyViewedStore((state) => state.productIds);
  const [products, setProducts] = useState<Product[]>([]);

  const ids = productIds.filter((id) => id !== excludeId);

  // Signed-in customers get their view history from the server (persists
  // across devices/sessions); guests and not-yet-resolved sessions fall
  // back to the localStorage-backed list below.
  useEffect(() => {
    if (status !== "authenticated") return;

    const query = excludeId ? `?excludeId=${excludeId}` : "";

    fetch(`/api/recently-viewed${query}`)
      .then((res) => res.json())
      .then((data: Product[]) => setProducts(data))
      .catch(() => {});
  }, [status, excludeId]);

  useEffect(() => {
    if (status === "authenticated") return;

    if (ids.length === 0) {
      Promise.resolve().then(() => setProducts([]));
      return;
    }

    fetch(`/api/products?ids=${ids.join(",")}`)
      .then((res) => res.json())
      .then((data: Product[]) => {
        // Preserve most-recently-viewed-first order — the API doesn't
        // guarantee it back.
        const byId = new Map(data.map((product) => [product.id, product]));
        setProducts(ids.map((id) => byId.get(id)).filter(Boolean) as Product[]);
      })
      .catch(() => setProducts([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, ids.join(",")]);

  if (products.length === 0) return null;

  return (
    <section className="mt-20">
      <p className="text-sm font-semibold uppercase tracking-widest text-brand-600">
        History
      </p>
      <h2 className="mt-2 mb-6 font-display text-3xl font-extrabold text-neutral-900 dark:text-white">
        Recently Viewed
      </h2>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={{
              id: product.id,
              name: product.name,
              price: product.price,
              image: product.image,
              description: product.description,
            }}
          />
        ))}
      </div>
    </section>
  );
}
