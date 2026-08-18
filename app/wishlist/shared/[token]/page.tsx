import Link from "next/link";
import { Heart } from "lucide-react";
import * as wishlistService from "@/features/wishlist/service";
import ProductCard from "@/features/products/components/ProductCard";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function SharedWishlistPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const shared = await wishlistService.getSharedWishlist(token);

  if (!shared) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-6 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
          <Heart className="h-9 w-9 text-neutral-400" />
        </div>
        <h1 className="mt-6 font-display text-3xl font-extrabold text-neutral-900 dark:text-white">
          Wishlist link not found
        </h1>
        <p className="mt-2 text-neutral-500">
          This share link is invalid or has expired.
        </p>
        <Button asChild variant="primary" className="mt-6">
          <Link href="/shop">Browse Products</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <p className="text-sm font-semibold uppercase tracking-widest text-brand-600">
        Shared Wishlist
      </p>
      <h1 className="mt-2 mb-8 font-display text-4xl font-extrabold text-neutral-900 dark:text-white">
        {shared.ownerName}&apos;s Wishlist
      </h1>

      {shared.items.length === 0 ? (
        <div className="rounded-3xl border border-neutral-200/70 bg-white p-16 text-center shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <Heart className="mx-auto h-12 w-12 text-neutral-300" />
          <p className="mt-4 text-lg font-semibold text-neutral-700 dark:text-neutral-200">
            This wishlist is empty
          </p>
        </div>
      ) : (
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {shared.items.map((item) => (
            <ProductCard
              key={item.id}
              product={{
                id: item.product.id,
                name: item.product.name,
                price: item.product.price,
                image: item.product.image,
                description: item.product.description,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
