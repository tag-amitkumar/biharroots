import { Prisma } from "@prisma/client";
import Fuse from "fuse.js";
import * as productRepository from "@/features/products/repository";
import * as reviewRepository from "@/features/reviews/repository";
import { parseNaturalLanguageQuery } from "@/features/products/nlpQuery";

// Lives outside products/service.ts and categories/service.ts specifically
// so both can depend on it without creating a cycle (products/service.ts
// already imports categoryService for category assignment).

export type ProductSort =
  | "newest"
  | "price-asc"
  | "price-desc"
  | "featured"
  | "popularity"
  | "rating"
  | "best-selling"
  | "most-reviewed";

export type ProductFilterInput = {
  search?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  brand?: string;
  availability?: "in-stock" | "out-of-stock";
  organicCertified?: boolean;
  vegan?: boolean;
  glutenFree?: boolean;
  sugarFree?: boolean;
  ecoFriendly?: boolean;
  countryOfOrigin?: string;
  weight?: string;
  rating?: number;
  discount?: boolean;
  newArrival?: boolean;
  bestSeller?: boolean;
  sort?: ProductSort;
  page?: number;
  pageSize?: number;
};

const NEW_ARRIVAL_WINDOW_DAYS = 30;
const SIMPLE_SORTS = new Set<ProductSort>(["newest", "price-asc", "price-desc", "featured"]);

const VALID_SORTS = new Set<string>([
  "newest",
  "price-asc",
  "price-desc",
  "featured",
  "popularity",
  "rating",
  "best-selling",
  "most-reviewed",
]);

// Shared query-string parsing so /api/products and
// /api/categories/[slug]/products interpret the same filter params
// identically rather than each reimplementing this.
export function parseProductFilterParams(searchParams: URLSearchParams): ProductFilterInput {
  const sort = searchParams.get("sort");
  const availability = searchParams.get("availability");
  const rating = searchParams.get("rating");
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  const page = searchParams.get("page");
  const pageSize = searchParams.get("pageSize");

  return {
    search: searchParams.get("search") || undefined,
    category: searchParams.get("category") || undefined,
    minPrice: minPrice ? Number(minPrice) : undefined,
    maxPrice: maxPrice ? Number(maxPrice) : undefined,
    brand: searchParams.get("brand") || undefined,
    availability:
      availability === "in-stock" || availability === "out-of-stock" ? availability : undefined,
    organicCertified: searchParams.get("organicCertified") === "true" || undefined,
    vegan: searchParams.get("vegan") === "true" || undefined,
    glutenFree: searchParams.get("glutenFree") === "true" || undefined,
    sugarFree: searchParams.get("sugarFree") === "true" || undefined,
    ecoFriendly: searchParams.get("ecoFriendly") === "true" || undefined,
    countryOfOrigin: searchParams.get("countryOfOrigin") || undefined,
    weight: searchParams.get("weight") || undefined,
    rating: rating ? Number(rating) : undefined,
    discount: searchParams.get("discount") === "true" || undefined,
    newArrival: searchParams.get("newArrival") === "true" || undefined,
    bestSeller: searchParams.get("bestSeller") === "true" || undefined,
    sort: sort && VALID_SORTS.has(sort) ? (sort as ProductSort) : undefined,
    page: page ? Number(page) : undefined,
    pageSize: pageSize ? Number(pageSize) : undefined,
  };
}

async function getRatingMap() {
  const groups = await reviewRepository.getRatingSummaries();

  return new Map(
    groups.map((group) => [
      group.productId,
      { avgRating: group._avg.rating || 0, reviewCount: group._count.rating },
    ])
  );
}

async function getSalesMap() {
  const groups = await productRepository.findSalesCounts();

  return new Map(groups.map((group) => [group.productId, group._sum.quantity || 0]));
}

// `extraWhere` lets a caller (categories/service.ts) scope the same filter
// set to a set of category ids, without this module needing to know
// anything about categories.
export async function findFilteredProducts(
  input: ProductFilterInput,
  extraWhere: Prisma.ProductWhereInput = {}
) {
  // Natural-language search: free text like "organic snacks under 300" may
  // embed structured signals - parse those out first (an explicit sidebar
  // filter always wins over an implicit one typed into the search box),
  // leaving only genuine leftover text to drive fuzzy matching below.
  let effectiveInput = input;
  let freeText: string | undefined;

  if (input.search?.trim()) {
    const knownBrands = await productRepository.findDistinctBrands();
    const parsed = parseNaturalLanguageQuery(input.search, knownBrands);

    effectiveInput = {
      ...input,
      maxPrice: input.maxPrice ?? parsed.maxPrice,
      organicCertified: input.organicCertified ?? parsed.organicCertified,
      vegan: input.vegan ?? parsed.vegan,
      glutenFree: input.glutenFree ?? parsed.glutenFree,
      sugarFree: input.sugarFree ?? parsed.sugarFree,
      ecoFriendly: input.ecoFriendly ?? parsed.ecoFriendly,
      brand: input.brand ?? parsed.brand,
    };

    freeText = parsed.freeText || undefined;
  }

  const and: Prisma.ProductWhereInput[] = [
    extraWhere,
    effectiveInput.category ? { category: effectiveInput.category } : {},
    effectiveInput.minPrice !== undefined ? { price: { gte: effectiveInput.minPrice } } : {},
    effectiveInput.maxPrice !== undefined ? { price: { lte: effectiveInput.maxPrice } } : {},
    effectiveInput.brand ? { brand: effectiveInput.brand } : {},
    effectiveInput.availability === "in-stock" ? { stock: { gt: 0 } } : {},
    effectiveInput.availability === "out-of-stock" ? { stock: { lte: 0 } } : {},
    effectiveInput.organicCertified ? { organicCertified: true } : {},
    effectiveInput.vegan ? { vegan: true } : {},
    effectiveInput.glutenFree ? { glutenFree: true } : {},
    effectiveInput.sugarFree ? { sugarFree: true } : {},
    effectiveInput.ecoFriendly ? { ecoFriendly: true } : {},
    effectiveInput.countryOfOrigin ? { countryOfOrigin: effectiveInput.countryOfOrigin } : {},
    effectiveInput.weight ? { weight: effectiveInput.weight } : {},
    effectiveInput.newArrival
      ? { createdAt: { gte: new Date(Date.now() - NEW_ARRIVAL_WINDOW_DAYS * 24 * 60 * 60 * 1000) } }
      : {},
  ];

  let ratingMap: Awaited<ReturnType<typeof getRatingMap>> | undefined;
  let salesMap: Awaited<ReturnType<typeof getSalesMap>> | undefined;

  if (effectiveInput.rating !== undefined) {
    ratingMap = await getRatingMap();
    const ids = [...ratingMap.entries()]
      .filter(([, rating]) => rating.avgRating >= effectiveInput.rating!)
      .map(([id]) => id);
    and.push({ id: { in: ids } });
  }

  if (effectiveInput.discount) {
    // mrp > price can't be expressed as a Prisma where clause (it compares
    // two columns on the same row), so qualify by id from a lightweight
    // fetch instead.
    const candidates = await productRepository.findProducts({ mrp: { not: null } });
    const ids = candidates.filter((p) => p.mrp !== null && p.mrp > p.price).map((p) => p.id);
    and.push({ id: { in: ids } });
  }

  if (effectiveInput.bestSeller) {
    salesMap = salesMap ?? (await getSalesMap());
    const ids = [...salesMap.entries()]
      .filter((entry): entry is [string, number] => entry[0] !== null && entry[1] > 0)
      .map(([id]) => id);
    and.push({ id: { in: ids } });
  }

  // Fuzzy, typo-tolerant free-text matching (Fuse.js) against whatever the
  // structured filters above already narrowed things down to - so
  // "organic mngo" (typo, and already-organic-scoped) still finds "Fresh
  // Alphonso Mango" via approximate matching across name/description/
  // brand/category, not just an exact substring.
  let fuseScoreById: Map<string, number> | undefined;

  if (freeText) {
    const candidates = await productRepository.findProducts({ AND: and });
    const fuse = new Fuse(candidates, {
      keys: ["name", "description", "brand", "category"],
      threshold: 0.4,
      includeScore: true,
    });

    const matches = fuse.search(freeText);
    fuseScoreById = new Map(matches.map((m) => [m.item.id, m.score ?? 1]));
    and.push({ id: { in: [...fuseScoreById.keys()] } });
  }

  const where: Prisma.ProductWhereInput = { AND: and };

  const skip =
    effectiveInput.page !== undefined && effectiveInput.pageSize !== undefined
      ? (effectiveInput.page - 1) * effectiveInput.pageSize
      : undefined;

  // A free-text search with no explicit sort choice ranks by relevance
  // blended with real popularity, rather than silently falling back to
  // "newest" - this is the actual "AI-powered ranking based on relevance
  // and popularity" behavior, not just a label.
  if (freeText && !effectiveInput.sort) {
    const allMatches = await productRepository.findProducts(where);
    salesMap = salesMap ?? (await getSalesMap());

    const maxSales = Math.max(1, ...[...salesMap.values()]);

    const scored = allMatches.map((product) => {
      const fuseScore = fuseScoreById!.get(product.id) ?? 1; // 0 = perfect match, 1 = worst
      const relevance = 1 - fuseScore;
      const popularity = (salesMap!.get(product.id) ?? 0) / maxSales;

      return { product, combined: relevance * 0.65 + popularity * 0.35 };
    });

    scored.sort((a, b) => b.combined - a.combined);

    const pageItems =
      effectiveInput.page !== undefined && effectiveInput.pageSize !== undefined
        ? scored.slice(skip, (skip ?? 0) + (effectiveInput.pageSize ?? scored.length))
        : scored;

    return pageItems.map((s) => s.product);
  }

  if (!effectiveInput.sort || SIMPLE_SORTS.has(effectiveInput.sort)) {
    const orderBy: Prisma.ProductOrderByWithRelationInput =
      effectiveInput.sort === "price-asc"
        ? { price: "asc" }
        : effectiveInput.sort === "price-desc"
          ? { price: "desc" }
          : effectiveInput.sort === "featured"
            ? { featured: "desc" }
            : { createdAt: "desc" };

    return productRepository.findProducts(where, orderBy, skip, effectiveInput.pageSize);
  }

  // Computed sorts (popularity/rating/best-selling/most-reviewed) rank by
  // data the DB can't order by directly (review aggregates, sales sums) -
  // fetch every match, rank in JS, then slice the requested page. Fine for
  // a catalog this size; a much larger one would need a materialized,
  // periodically-refreshed sort column instead.
  const allMatches = await productRepository.findProducts(where, { createdAt: "desc" });

  ratingMap = ratingMap ?? (await getRatingMap());
  salesMap =
    effectiveInput.sort === "popularity" || effectiveInput.sort === "best-selling"
      ? (salesMap ?? (await getSalesMap()))
      : salesMap;

  const scored = allMatches.map((product) => {
    const rating = ratingMap!.get(product.id);
    const sales = salesMap?.get(product.id) ?? 0;

    const key =
      effectiveInput.sort === "rating"
        ? (rating?.avgRating ?? 0)
        : effectiveInput.sort === "most-reviewed"
          ? (rating?.reviewCount ?? 0)
          : sales;

    return { product, key };
  });

  scored.sort((a, b) => b.key - a.key);

  const pageItems =
    effectiveInput.page !== undefined && effectiveInput.pageSize !== undefined
      ? scored.slice(skip, (skip ?? 0) + (effectiveInput.pageSize ?? scored.length))
      : scored;

  return pageItems.map((s) => s.product);
}
