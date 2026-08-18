import * as recommendationsRepository from "@/features/recommendations/repository";
import * as productRepository from "@/features/products/repository";
import * as reviewRepository from "@/features/reviews/repository";
import * as filtering from "@/features/products/filtering";

const TRENDING_WINDOW_DAYS = 30;

// Real calendar-driven seasonal hints, deterministic (no LLM) - the same
// "keyword -> real catalog match" approach nlpQuery.ts uses for health
// goals, not a fabricated/hardcoded product list. Months are 0-indexed
// (Date#getMonth()) and partitioned by India's climate/festival calendar,
// covering all 12 months exactly once.
const SEASONS: { months: number[]; keywords: string; label: string }[] = [
  { months: [11, 0, 1], keywords: "immunity herbal dry fruits warm", label: "Winter Wellness" },
  { months: [2, 3, 4], keywords: "cooling hydration juice summer", label: "Summer Refreshers" },
  { months: [5, 6, 7, 8], keywords: "herbal tea digestion immunity monsoon", label: "Monsoon Care" },
  { months: [9, 10], keywords: "dry fruits sweets gifting festive", label: "Festive Season" },
];

function getCurrentSeason(referenceDate: Date) {
  const month = referenceDate.getMonth();
  return SEASONS.find((season) => season.months.includes(month)) ?? SEASONS[0];
}

const HEALTH_ATTRIBUTE_KEYS = ["organicCertified", "vegan", "glutenFree", "sugarFree", "ecoFriendly"] as const;

function healthAttributeScore(product: Record<(typeof HEALTH_ATTRIBUTE_KEYS)[number], boolean>): number {
  return HEALTH_ATTRIBUTE_KEYS.reduce((sum, key) => sum + (product[key] ? 1 : 0), 0);
}

// "Healthier Alternatives": real products in the same category that
// genuinely have MORE of the real dietary attributes (organic/vegan/
// gluten-free/sugar-free/eco-friendly) than the product being viewed -
// not just "other items in this category". Empty when nothing in the
// category actually qualifies as a real improvement, rather than
// padding the list with lateral (non-healthier) picks.
export async function getHealthierAlternatives(productId: string, limit = 4) {
  const product = await productRepository.findProductById(productId);

  if (!product) return [];

  const baseScore = healthAttributeScore(product);

  const pool = await recommendationsRepository.findCategoryPool(product.category, [productId], limit * 6);

  const healthierCandidates = pool.filter((candidate) => healthAttributeScore(candidate) > baseScore);

  if (healthierCandidates.length === 0) return [];

  const ratingByProductId = await getRatingByProductId();

  return scoreByPriceAndRating(healthierCandidates, product.price, ratingByProductId).slice(0, limit);
}

// "Seasonal Recommendations": maps the current month to real, sensible
// shopping intent (e.g. immunity/warming picks in winter), then runs each
// keyword through the same fuzzy-match search that powers AI Smart Search
// - so results are always real catalog matches, never a fabricated or
// hardcoded product list. Each keyword is searched separately (OR
// semantics) rather than as one multi-word phrase: Fuse.js scores a
// search string against a whole match, so "herbal tea digestion immunity
// monsoon" as a single query would require an unrealistic near-complete
// phrase match and return nothing even though "herbal" or "tea" alone
// each match plenty of real products.
export async function getSeasonalRecommendations(limit = 8, referenceDate: Date = new Date()) {
  const season = getCurrentSeason(referenceDate);
  const keywords = season.keywords.split(" ");

  const resultsByKeyword = await Promise.all(
    keywords.map((keyword) =>
      filtering.findFilteredProducts({ search: keyword, page: 1, pageSize: limit })
    )
  );

  const seen = new Set<string>();
  const products = resultsByKeyword
    .flat()
    .filter((product) => {
      if (seen.has(product.id)) return false;
      seen.add(product.id);
      return true;
    })
    .slice(0, limit);

  return { label: season.label, products };
}

async function getRatingByProductId() {
  const groups = await reviewRepository.getRatingSummaries();

  return new Map(
    groups.map((group) => [
      group.productId,
      { avgRating: group._avg.rating || 0, reviewCount: group._count.rating },
    ])
  );
}

// Multi-factor score, not a single sort key: a candidate close in price to
// what the shopper is already looking at, with a strong rating, ranks above
// one that's merely in the same category. Both factors are normalized to
// 0-1 so neither dominates just because of its raw scale.
function scoreByPriceAndRating<T extends { id: string; price: number }>(
  candidates: T[],
  referencePrice: number,
  ratingByProductId: Map<string, { avgRating: number; reviewCount: number }>
) {
  return candidates
    .map((candidate) => {
      const rating = ratingByProductId.get(candidate.id);
      const priceDelta =
        referencePrice > 0 ? Math.abs(candidate.price - referencePrice) / referencePrice : 0;
      const priceScore = Math.max(0, 1 - priceDelta);
      const ratingScore = (rating?.avgRating ?? 0) / 5;

      return { candidate, score: priceScore * 0.5 + ratingScore * 0.5 };
    })
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.candidate);
}

// "Similar Products": same category, then ranked by how close the price is
// and how well-rated it is - not just "first 4 rows in this category".
export async function getSimilarProducts(productId: string, limit = 4) {
  const product = await productRepository.findProductById(productId);

  if (!product) return [];

  const pool = await recommendationsRepository.findCategoryPool(
    product.category,
    [productId],
    limit * 5
  );

  if (pool.length === 0) return [];

  const ratingByProductId = await getRatingByProductId();

  return scoreByPriceAndRating(pool, product.price, ratingByProductId).slice(0, limit);
}

// "You May Also Like": real collaborative filtering from OrderItem
// co-occurrence - products other customers bought in the same order as this
// one, ranked by how often that pairing happened. Falls back to an empty
// list (rather than guessing) when this product has never actually sold.
export async function getYouMayAlsoLike(productId: string, limit = 4) {
  const orders = await recommendationsRepository.findOrderIdsContainingProduct(productId);
  const orderIds = [...new Set(orders.map((order) => order.orderId))];

  if (orderIds.length === 0) return [];

  const groups = await recommendationsRepository.findCoPurchaseCounts(orderIds);

  const coPurchasedIds = groups
    .map((group) => group.productId)
    .filter((id): id is string => !!id && id !== productId);

  if (coPurchasedIds.length === 0) return [];

  const products = await productRepository.findProductsByIds(coPurchasedIds);
  const productById = new Map(products.map((product) => [product.id, product]));

  // groupBy's order (by co-purchase frequency) is the signal - preserve it
  // rather than however findProductsByIds happens to return rows.
  return coPurchasedIds
    .map((id) => productById.get(id))
    .filter((product): product is NonNullable<typeof product> => !!product)
    .slice(0, limit);
}

// "Frequently Bought Together": the same co-purchase signal as You May Also
// Like, but packaged as a small bundle (product + its top companions) for a
// dedicated bundle widget rather than a recommendation grid. Returns null
// when there are no qualifying companions, so the caller can hide the
// bundle section entirely instead of rendering it empty.
export async function getFrequentlyBoughtTogether(productId: string, limit = 3) {
  const baseProduct = await productRepository.findProductById(productId);

  if (!baseProduct) return null;

  const companions = await getYouMayAlsoLike(productId, limit);

  if (companions.length === 0) return null;

  return { baseProduct, companions };
}

// "Trending Products": real last-30-day sales velocity, not just "newest
// products". A brand-new store (or one with a quiet month) won't have
// enough order history to fill the section, so it's backfilled with the
// newest products - same graceful behavior the old placeholder had, just
// only used when the real signal runs dry.
export async function getTrendingProducts(limit = 8) {
  const since = new Date(Date.now() - TRENDING_WINDOW_DAYS * 24 * 60 * 60 * 1000);
  const groups = await recommendationsRepository.findTrendingCounts(since, limit);

  const trendingIds = groups
    .map((group) => group.productId)
    .filter((id): id is string => !!id);

  const trendingProducts = trendingIds.length
    ? await productRepository.findProductsByIds(trendingIds)
    : [];
  const trendingById = new Map(trendingProducts.map((product) => [product.id, product]));

  const orderedTrending = trendingIds
    .map((id) => trendingById.get(id))
    .filter((product): product is NonNullable<typeof product> => !!product);

  if (orderedTrending.length >= limit) {
    return orderedTrending.slice(0, limit);
  }

  const fallback = await productRepository.findProducts(
    { id: { notIn: trendingIds } },
    { createdAt: "desc" },
    undefined,
    limit - orderedTrending.length
  );

  return [...orderedTrending, ...fallback];
}

// "Recommended For You": built from what this specific customer has
// actually bought before, not a generic list. Returns null (not []) when
// they have no order history yet, so the caller can tell "personalize with
// real data" apart from "personalized, and it's genuinely empty" and fall
// back to a different heuristic (e.g. recently-viewed) for new customers.
export async function getRecommendedForYou(userId: string, limit = 8) {
  const purchasedRows = await recommendationsRepository.findPurchasedProductCategories(userId);

  if (purchasedRows.length === 0) return null;

  const purchasedProductIds = new Set(
    purchasedRows.map((row) => row.product?.id).filter((id): id is string => !!id)
  );

  const categoryCounts = new Map<string, number>();
  purchasedRows.forEach((row) => {
    const category = row.product?.category;
    if (category) categoryCounts.set(category, (categoryCounts.get(category) || 0) + 1);
  });

  const topCategories = [...categoryCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([category]) => category);

  const excludeIds = [...purchasedProductIds];
  const candidates = [];

  for (const category of topCategories) {
    if (candidates.length >= limit * 3) break;

    const pool = await recommendationsRepository.findCategoryPool(
      category,
      [...excludeIds, ...candidates.map((candidate) => candidate.id)],
      limit * 3
    );

    candidates.push(...pool);
  }

  if (candidates.length === 0) return [];

  const ratingByProductId = await getRatingByProductId();

  const scored = candidates
    .map((candidate) => ({
      candidate,
      score: ratingByProductId.get(candidate.id)?.avgRating ?? 0,
    }))
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.candidate);

  return scored.slice(0, limit);
}

// Cart cross-sell: aggregates the co-purchase signal (the same one behind
// You May Also Like) across every distinct product already in the cart,
// so a cart of 3 items surfaces companions to any of them, ranked by how
// many of the cart's items they're frequently bought alongside. Falls back
// to trending products (excluding what's already in the cart) when none of
// the cart's items have any co-purchase history yet.
export async function getCartCrossSell(cartProductIds: string[], limit = 4) {
  const uniqueCartIds = [...new Set(cartProductIds)];

  if (uniqueCartIds.length === 0) return [];

  const scoreByProductId = new Map<string, number>();
  const productById = new Map<string, Awaited<ReturnType<typeof getYouMayAlsoLike>>[number]>();

  for (const productId of uniqueCartIds) {
    const companions = await getYouMayAlsoLike(productId, limit * 2);

    companions.forEach((companion) => {
      if (uniqueCartIds.includes(companion.id)) return;

      scoreByProductId.set(companion.id, (scoreByProductId.get(companion.id) || 0) + 1);
      productById.set(companion.id, companion);
    });
  }

  if (scoreByProductId.size > 0) {
    return [...scoreByProductId.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([id]) => productById.get(id)!);
  }

  const trending = await getTrendingProducts(limit + uniqueCartIds.length);

  return trending.filter((product) => !uniqueCartIds.includes(product.id)).slice(0, limit);
}
