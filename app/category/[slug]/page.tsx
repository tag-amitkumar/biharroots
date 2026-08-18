import { cache } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Tag } from "lucide-react";
import * as categoryService from "@/features/categories/service";
import * as reviewService from "@/features/reviews/service";
import * as couponService from "@/features/coupons/service";
import Breadcrumbs from "@/features/categories/components/Breadcrumbs";
import CategorySection from "@/features/categories/components/CategorySection";
import CategoryShopSection from "@/features/categories/components/CategoryShopSection";
import CategoryCard from "@/features/categories/components/CategoryCard";
import RecentlyViewed from "@/features/products/components/RecentlyViewed";
import RecommendedForYou from "@/features/products/components/RecommendedForYou";
import SafeImage from "@/components/SafeImage";
import { SITE_URL } from "@/lib/site";

// generateMetadata and the page component both need the category, but each
// call to getCategoryBySlug increments its view count - without request-level
// memoization, a single page view would double-count. React's cache() dedupes
// calls with the same arguments within one render pass.
const getCategoryOnce = cache((slug: string) => categoryService.getCategoryBySlug(slug));

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryOnce(slug);

  if (!category || !category.enabled) {
    return { title: "Category Not Found" };
  }

  // No site name here: the root layout's title template appends it, and
  // openGraph carries the brand via its own siteName field. Baking it in was
  // producing "Sattu | Grains, Rice & Flour | NatureCart | NatureCart".
  const title = category.metaTitle || category.name;
  const description = category.metaDescription || category.description || undefined;

  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/category/${category.slug}` },
    openGraph: {
      title,
      description,
      images: category.banner ? [{ url: category.banner }] : undefined,
    },
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const category = await getCategoryOnce(slug);

  if (!category || !category.enabled) {
    notFound();
  }

  const categoryIds = await categoryService.getCategoryIdsForBrowsing(category);

  const [featured, newArrivals, bestSellers, trending, allRatings, activeCoupons] =
    await Promise.all([
      categoryService.getFeaturedProductsForCategory(categoryIds, 4),
      categoryService.getNewArrivalsForCategory(categoryIds, 4),
      categoryService.getBestSellersForCategory(categoryIds, 4),
      categoryService.getTrendingForCategory(categoryIds, 4),
      reviewService.getRatingSummaries(),
      couponService.listActiveCoupons(),
    ]);

  const ratingByProductId = new Map(allRatings.map((r) => [r.productId, r]));

  const isSubcategory = Boolean(category.parent);
  const relatedCategories = isSubcategory
    ? [] // populated below from the parent's sibling children
    : category.children.filter((c) => c.enabled);

  const breadcrumbItems = isSubcategory && category.parent
    ? [
        { label: category.parent.name, href: `/category/${category.parent.slug}` },
        { label: category.name },
      ]
    : [{ label: category.name }];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: category.name,
    description: category.description || undefined,
    url: `${SITE_URL}/category/${category.slug}`,
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        ...(isSubcategory && category.parent
          ? [
              {
                "@type": "ListItem",
                position: 2,
                name: category.parent.name,
                item: `${SITE_URL}/category/${category.parent.slug}`,
              },
            ]
          : []),
        {
          "@type": "ListItem",
          position: isSubcategory ? 3 : 2,
          name: category.name,
          item: `${SITE_URL}/category/${category.slug}`,
        },
      ],
    },
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Breadcrumbs items={breadcrumbItems} />

      <div className="relative mb-10 overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 to-brand-700 text-white">
        <div className="absolute inset-0">
          <SafeImage src={category.banner} alt="" fill sizes="100vw" className="object-cover opacity-30" kind="category" />
        </div>

        <div className="relative p-8 sm:p-12">
          <span className="text-4xl">{category.icon || "🌿"}</span>
          <h1 className="mt-4 font-display text-4xl font-extrabold sm:text-5xl">{category.name}</h1>
          {category.description && (
            <p className="mt-3 max-w-2xl text-white/90">{category.description}</p>
          )}
          <p className="mt-4 text-sm text-white/70">{category._count.products} products</p>
        </div>
      </div>

      {relatedCategories.length > 0 && (
        <div className="mb-10">
          <h2 className="mb-4 font-display text-2xl font-bold text-neutral-900 dark:text-white">
            Subcategories
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {relatedCategories.map((child) => (
              <CategoryCard key={child.id} category={child} />
            ))}
          </div>
        </div>
      )}

      {activeCoupons.length > 0 && (
        <div className="mb-10 flex flex-wrap items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/40 dark:bg-amber-900/10">
          <Tag className="h-5 w-5 shrink-0 text-amber-600" />
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
            Active offers:{" "}
            {activeCoupons.map((c) => c.code).join(", ")} — apply at checkout
          </p>
        </div>
      )}

      <CategorySection
        eyebrow="Handpicked"
        title="Featured Products"
        products={featured}
        ratingByProductId={ratingByProductId}
      />

      <CategorySection
        eyebrow="Just In"
        title="New Arrivals"
        products={newArrivals}
        ratingByProductId={ratingByProductId}
      />

      <CategorySection
        eyebrow="Most Popular"
        title="Best Sellers"
        products={bestSellers}
        ratingByProductId={ratingByProductId}
      />

      <CategorySection
        eyebrow="Right Now"
        title="Trending"
        products={trending}
        ratingByProductId={ratingByProductId}
      />

      <section className="mt-16">
        <h2 className="mb-6 font-display text-3xl font-extrabold text-neutral-900 dark:text-white">
          Shop All {category.name}
        </h2>

        <CategoryShopSection slug={category.slug} />
      </section>

      <RecentlyViewed />

      <RecommendedForYou />
    </div>
  );
}
