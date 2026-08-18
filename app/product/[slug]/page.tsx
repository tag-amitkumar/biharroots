import { notFound } from "next/navigation";
import type { Metadata } from "next";
import * as productService from "@/features/products/service";
import * as reviewService from "@/features/reviews/service";
import * as recommendationsService from "@/features/recommendations/service";
import ProductDetailView from "@/features/products/components/ProductDetailView";
import ProductCard from "@/features/products/components/ProductCard";
import FrequentlyBoughtTogether from "@/features/products/components/FrequentlyBoughtTogether";
import RecentlyViewed from "@/features/products/components/RecentlyViewed";
import ProductReviews from "@/features/reviews/components/ProductReviews";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await productService.getProduct(slug);

  if (!product) {
    return { title: "Product Not Found" };
  }

  const title = product.seoTitle || product.name;
  const description =
    product.seoMetaDescription || product.description?.slice(0, 160) || undefined;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: product.image ? [{ url: product.image }] : undefined,
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const product = await productService.getProduct(slug);

  if (!product) {
    notFound();
  }

  const [relatedProducts, youMayAlsoLikeRaw, frequentlyBoughtTogether, rating, allRatings, healthierAlternatives] =
    await Promise.all([
      productService.getRelatedProducts(product.id),
      recommendationsService.getYouMayAlsoLike(product.id),
      recommendationsService.getFrequentlyBoughtTogether(product.id),
      reviewService.getRatingSummary(product.id),
      reviewService.getRatingSummaries(),
      recommendationsService.getHealthierAlternatives(product.id),
    ]);

  const ratingByProductId = new Map(allRatings.map((r) => [r.productId, r]));

  // Avoid showing the same product twice across both sections.
  const relatedIds = new Set(relatedProducts.map((p) => p.id));
  const youMayAlsoLike = youMayAlsoLikeRaw.filter((p) => !relatedIds.has(p.id));

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <ProductDetailView
        product={product}
        rating={rating.avgRating}
        reviewCount={rating.reviewCount}
      />

      {frequentlyBoughtTogether && (
        <FrequentlyBoughtTogether
          baseProduct={frequentlyBoughtTogether.baseProduct}
          companions={frequentlyBoughtTogether.companions}
        />
      )}

      {relatedProducts.length > 0 && (
        <section className="mt-20">
          <p className="text-sm font-semibold uppercase tracking-widest text-brand-600">
            Similar Products
          </p>
          <h2 className="mt-2 mb-6 font-display text-3xl font-extrabold text-neutral-900 dark:text-white">
            You Might Also Consider
          </h2>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {relatedProducts.map((related) => {
              const relatedRating = ratingByProductId.get(related.id);

              return (
                <ProductCard
                  key={related.id}
                  product={{
                    id: related.id,
                    name: related.name,
                    price: related.price,
                    image: related.image,
                    description: related.description,
                    rating: relatedRating?.avgRating,
                    reviewCount: relatedRating?.reviewCount,
                  }}
                />
              );
            })}
          </div>
        </section>
      )}

      {youMayAlsoLike.length > 0 && (
        <section className="mt-20">
          <p className="text-sm font-semibold uppercase tracking-widest text-brand-600">
            Customers Also Bought
          </p>
          <h2 className="mt-2 mb-6 font-display text-3xl font-extrabold text-neutral-900 dark:text-white">
            You May Also Like
          </h2>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {youMayAlsoLike.map((related) => {
              const relatedRating = ratingByProductId.get(related.id);

              return (
                <ProductCard
                  key={related.id}
                  product={{
                    id: related.id,
                    name: related.name,
                    price: related.price,
                    image: related.image,
                    description: related.description,
                    rating: relatedRating?.avgRating,
                    reviewCount: relatedRating?.reviewCount,
                  }}
                />
              );
            })}
          </div>
        </section>
      )}

      {healthierAlternatives.length > 0 && (
        <section className="mt-20">
          <p className="text-sm font-semibold uppercase tracking-widest text-brand-600">
            Health &amp; Nutrition
          </p>
          <h2 className="mt-2 mb-6 font-display text-3xl font-extrabold text-neutral-900 dark:text-white">
            Healthier Alternatives
          </h2>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {healthierAlternatives.map((related) => {
              const relatedRating = ratingByProductId.get(related.id);

              return (
                <ProductCard
                  key={related.id}
                  product={{
                    id: related.id,
                    name: related.name,
                    price: related.price,
                    image: related.image,
                    description: related.description,
                    rating: relatedRating?.avgRating,
                    reviewCount: relatedRating?.reviewCount,
                  }}
                />
              );
            })}
          </div>
        </section>
      )}

      <RecentlyViewed excludeId={product.id} />

      <ProductReviews productId={product.id} />
    </div>
  );
}
