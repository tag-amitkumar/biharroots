"use client";

import { useEffect, useState } from "react";
import SafeImage from "@/components/SafeImage";
import Link from "next/link";
import { Scale, Star, X } from "lucide-react";
import { useCompareStore } from "@/features/products/compareStore";
import { getRatings } from "@/features/products/productsCache";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Product = {
  id: string;
  name: string;
  image: string;
  price: number;
  category: string;
  stock: number;
  specifications: string;
};

type Rating = { productId: string; avgRating: number; reviewCount: number };

function getSpecs(product: Product): Record<string, string> {
  try {
    return JSON.parse(product.specifications || "{}");
  } catch {
    return {};
  }
}

// A cell is a "winner" when it ties for the best value in its row - shown
// with a highlight so the eye is drawn straight to the best price/rating/
// availability instead of having to scan every column.
function bestIds<T>(products: Product[], valueOf: (product: Product) => T | null, better: (a: T, b: T) => boolean) {
  let best: T | null = null;

  products.forEach((product) => {
    const value = valueOf(product);
    if (value === null) return;
    if (best === null || better(value, best)) best = value;
  });

  if (best === null) return new Set<string>();

  return new Set(
    products.filter((product) => {
      const value = valueOf(product);
      return value !== null && !better(best as T, value) && !better(value, best as T);
    }).map((product) => product.id)
  );
}

export default function ComparePage() {
  const productIds = useCompareStore((state) => state.productIds);
  const toggle = useCompareStore((state) => state.toggle);
  const [products, setProducts] = useState<Product[] | null>(null);
  const [ratings, setRatings] = useState<Rating[]>([]);

  useEffect(() => {
    if (productIds.length === 0) {
      Promise.resolve().then(() => setProducts([]));
      return;
    }

    Promise.all([
      fetch(`/api/products?ids=${productIds.join(",")}`).then((res) => res.json()),
      getRatings(),
    ])
      .then(([productData, ratingData]) => {
        setProducts(productData);
        setRatings(ratingData);
      })
      .catch(() => setProducts([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productIds.join(",")]);

  if (products === null) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-20">
        <div className="h-96 animate-pulse rounded-3xl bg-neutral-200 dark:bg-neutral-800" />
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-6 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
          <Scale className="h-9 w-9 text-neutral-400" />
        </div>
        <h1 className="mt-6 font-display text-3xl font-extrabold text-neutral-900 dark:text-white">
          No products to compare
        </h1>
        <p className="mt-2 text-neutral-500">
          Add products using the &quot;Add to Compare&quot; checkbox on any
          product card.
        </p>
        <Button asChild variant="primary" className="mt-6">
          <Link href="/shop">Browse Products</Link>
        </Button>
      </div>
    );
  }

  const ratingByProductId = new Map(ratings.map((r) => [r.productId, r]));
  const specKeys = Array.from(
    new Set(products.flatMap((product) => Object.keys(getSpecs(product))))
  );

  const bestPriceIds = bestIds(products, (p) => p.price, (a, b) => a < b);

  const bestRatingIds = bestIds(
    products,
    (p) => {
      const rating = ratingByProductId.get(p.id);
      return rating && rating.reviewCount > 0 ? rating.avgRating : null;
    },
    (a, b) => a > b
  );

  const bestStockIds = bestIds(products, (p) => p.stock, (a, b) => a > b);

  const winningCellClass = "bg-brand-50 font-bold text-brand-700 dark:bg-brand-900/20 dark:text-brand-400";

  const productList = products;

  function specValuesDiffer(key: string) {
    const values = productList.map((product) => getSpecs(product)[key] ?? "—");
    return new Set(values).size > 1;
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <p className="text-sm font-semibold uppercase tracking-widest text-brand-600">
        Side by Side
      </p>
      <h1 className="mt-2 mb-8 font-display text-4xl font-extrabold text-neutral-900 dark:text-white">
        Compare Products
      </h1>

      <div className="overflow-x-auto rounded-3xl border border-neutral-200/70 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <table className="w-full text-left">
          <thead>
            <tr>
              <th className="p-4"></th>
              {products.map((product) => (
                <th key={product.id} className="p-4 text-center align-top">
                  <button
                    onClick={() => toggle(product.id)}
                    aria-label={`Remove ${product.name} from comparison`}
                    className="ml-auto mb-1 flex h-6 w-6 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>

                  <div className="relative mx-auto h-24 w-24 overflow-hidden rounded-xl">
                    <SafeImage src={product.image} alt={product.name} fill sizes="96px" className="object-cover" />
                  </div>
                  <p className="mt-2 font-bold text-neutral-900 dark:text-white">{product.name}</p>
                  <Link
                    href={`/product/${product.id}`}
                    className="text-xs font-semibold text-brand-600 hover:underline"
                  >
                    View
                  </Link>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            <tr className="border-t border-neutral-100 dark:border-neutral-800">
              <td className="p-4 font-semibold text-neutral-500">Price</td>
              {products.map((product) => (
                <td
                  key={product.id}
                  className={cn(
                    "p-4 text-center font-bold text-brand-600",
                    bestPriceIds.has(product.id) && bestPriceIds.size < products.length && winningCellClass
                  )}
                >
                  ₹{product.price}
                </td>
              ))}
            </tr>

            <tr className="border-t border-neutral-100 dark:border-neutral-800">
              <td className="p-4 font-semibold text-neutral-500">Rating</td>
              {products.map((product) => {
                const rating = ratingByProductId.get(product.id);
                const hasRating = rating && rating.reviewCount > 0;

                return (
                  <td
                    key={product.id}
                    className={cn(
                      "p-4 text-center text-neutral-700 dark:text-neutral-200",
                      bestRatingIds.has(product.id) && bestRatingIds.size < products.length && winningCellClass
                    )}
                  >
                    {hasRating ? (
                      <span className="inline-flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        {rating.avgRating.toFixed(1)}
                        <span className="text-xs text-neutral-400">({rating.reviewCount})</span>
                      </span>
                    ) : (
                      "No reviews yet"
                    )}
                  </td>
                );
              })}
            </tr>

            <tr className="border-t border-neutral-100 dark:border-neutral-800">
              <td className="p-4 font-semibold text-neutral-500">Category</td>
              {products.map((product) => (
                <td key={product.id} className="p-4 text-center capitalize text-neutral-700 dark:text-neutral-200">
                  {product.category}
                </td>
              ))}
            </tr>

            <tr className="border-t border-neutral-100 dark:border-neutral-800">
              <td className="p-4 font-semibold text-neutral-500">Availability</td>
              {products.map((product) => (
                <td
                  key={product.id}
                  className={cn(
                    "p-4 text-center text-neutral-700 dark:text-neutral-200",
                    product.stock > 0 &&
                      bestStockIds.has(product.id) &&
                      bestStockIds.size < products.length &&
                      winningCellClass
                  )}
                >
                  {product.stock > 0
                    ? `${product.stock} available`
                    : "Out of stock"}
                </td>
              ))}
            </tr>

            {specKeys.map((key) => {
              const differs = specValuesDiffer(key);

              return (
                <tr
                  key={key}
                  className={cn(
                    "border-t border-neutral-100 dark:border-neutral-800",
                    differs && "bg-amber-50/60 dark:bg-amber-900/10"
                  )}
                >
                  <td className="p-4 font-semibold text-neutral-500">
                    {key}
                    {differs && (
                      <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-amber-500" aria-hidden />
                    )}
                  </td>
                  {products.map((product) => (
                    <td key={product.id} className="p-4 text-center text-neutral-700 dark:text-neutral-200">
                      {getSpecs(product)[key] || "—"}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
