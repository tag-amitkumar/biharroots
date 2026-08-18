import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/features/recommendations/repository", () => ({
  findCategoryPool: vi.fn(),
  findOrderIdsContainingProduct: vi.fn(),
  findCoPurchaseCounts: vi.fn(),
  findTrendingCounts: vi.fn(),
  findPurchasedProductCategories: vi.fn(),
}));

vi.mock("@/features/products/repository", () => ({
  findProductById: vi.fn(),
  findProductsByIds: vi.fn(),
  findProducts: vi.fn(),
}));

vi.mock("@/features/reviews/repository", () => ({
  getRatingSummaries: vi.fn(() => []),
}));

vi.mock("@/features/products/filtering", () => ({
  findFilteredProducts: vi.fn(() => []),
}));

import * as recommendationsRepository from "@/features/recommendations/repository";
import * as productRepository from "@/features/products/repository";
import * as reviewRepository from "@/features/reviews/repository";
import * as filtering from "@/features/products/filtering";
import {
  getSimilarProducts,
  getYouMayAlsoLike,
  getFrequentlyBoughtTogether,
  getTrendingProducts,
  getRecommendedForYou,
  getCartCrossSell,
  getSeasonalRecommendations,
  getHealthierAlternatives,
} from "@/features/recommendations/service";

function product(
  overrides: Partial<{
    id: string;
    price: number;
    category: string;
    organicCertified: boolean;
    vegan: boolean;
    glutenFree: boolean;
    sugarFree: boolean;
    ecoFriendly: boolean;
  }>
) {
  return {
    id: "p1",
    name: "Product",
    price: 100,
    category: "snacks",
    description: "",
    image: "",
    stock: 10,
    images: "",
    specifications: "{}",
    createdAt: new Date(),
    updatedAt: new Date(),
    variants: [],
    brand: null,
    mrp: null,
    organicCertified: false,
    vegan: false,
    glutenFree: false,
    sugarFree: false,
    ecoFriendly: false,
    countryOfOrigin: null,
    weight: null,
    featured: false,
    seoTitle: null,
    seoMetaDescription: null,
    detailedDescription: null,
    highlights: "[]",
    keyBenefits: "[]",
    ingredients: null,
    usageInstructions: null,
    storageInstructions: null,
    faqs: "[]",
    seoKeywords: "[]",
    tags: "[]",
    imageAlt: null,
    ...overrides,
  };
}

beforeEach(() => {
  vi.mocked(recommendationsRepository.findCategoryPool).mockReset();
  vi.mocked(recommendationsRepository.findOrderIdsContainingProduct).mockReset();
  vi.mocked(recommendationsRepository.findCoPurchaseCounts).mockReset();
  vi.mocked(recommendationsRepository.findTrendingCounts).mockReset();
  vi.mocked(recommendationsRepository.findPurchasedProductCategories).mockReset();
  vi.mocked(productRepository.findProductById).mockReset();
  vi.mocked(productRepository.findProductsByIds).mockReset();
  vi.mocked(productRepository.findProducts).mockReset();
  vi.mocked(reviewRepository.getRatingSummaries).mockReset().mockResolvedValue([]);
});

describe("getSimilarProducts", () => {
  it("returns an empty list when the reference product doesn't exist", async () => {
    vi.mocked(productRepository.findProductById).mockResolvedValue(null);

    await expect(getSimilarProducts("missing")).resolves.toEqual([]);
    expect(recommendationsRepository.findCategoryPool).not.toHaveBeenCalled();
  });

  it("ranks same-category candidates by price closeness and rating, not insertion order", async () => {
    vi.mocked(productRepository.findProductById).mockResolvedValue(
      product({ id: "p1", price: 100 })
    );

    const farPriceNoRating = product({ id: "far", price: 500 });
    const closePriceHighRating = product({ id: "close", price: 105 });

    vi.mocked(recommendationsRepository.findCategoryPool).mockResolvedValue([
      farPriceNoRating,
      closePriceHighRating,
    ]);

    vi.mocked(reviewRepository.getRatingSummaries).mockResolvedValue([
      { productId: "close", _avg: { rating: 5 }, _count: { rating: 10 } },
    ] as never);

    const result = await getSimilarProducts("p1");

    expect(result.map((p) => p.id)).toEqual(["close", "far"]);
  });
});

describe("getYouMayAlsoLike", () => {
  it("returns an empty list when the product has never been ordered", async () => {
    vi.mocked(recommendationsRepository.findOrderIdsContainingProduct).mockResolvedValue([]);

    await expect(getYouMayAlsoLike("p1")).resolves.toEqual([]);
    expect(recommendationsRepository.findCoPurchaseCounts).not.toHaveBeenCalled();
  });

  it("orders results by co-purchase frequency and excludes the product itself", async () => {
    vi.mocked(recommendationsRepository.findOrderIdsContainingProduct).mockResolvedValue([
      { orderId: "order-1" },
      { orderId: "order-2" },
    ] as never);

    vi.mocked(recommendationsRepository.findCoPurchaseCounts).mockResolvedValue([
      { productId: "most-common", _count: { productId: 5 } },
      { productId: "p1", _count: { productId: 5 } },
      { productId: "less-common", _count: { productId: 2 } },
    ] as never);

    vi.mocked(productRepository.findProductsByIds).mockResolvedValue([
      product({ id: "less-common" }),
      product({ id: "most-common" }),
    ]);

    const result = await getYouMayAlsoLike("p1");

    expect(result.map((p) => p.id)).toEqual(["most-common", "less-common"]);
  });
});

describe("getFrequentlyBoughtTogether", () => {
  it("returns null when the base product doesn't exist", async () => {
    vi.mocked(productRepository.findProductById).mockResolvedValue(null);

    await expect(getFrequentlyBoughtTogether("missing")).resolves.toBeNull();
  });

  it("returns null when there are no qualifying companions, so the caller can hide the bundle", async () => {
    vi.mocked(productRepository.findProductById).mockResolvedValue(product({ id: "p1" }));
    vi.mocked(recommendationsRepository.findOrderIdsContainingProduct).mockResolvedValue([]);

    await expect(getFrequentlyBoughtTogether("p1")).resolves.toBeNull();
  });

  it("bundles the base product with its top co-purchased companions", async () => {
    vi.mocked(productRepository.findProductById).mockResolvedValue(product({ id: "p1" }));
    vi.mocked(recommendationsRepository.findOrderIdsContainingProduct).mockResolvedValue([
      { orderId: "order-1" },
    ] as never);
    vi.mocked(recommendationsRepository.findCoPurchaseCounts).mockResolvedValue([
      { productId: "companion-1", _count: { productId: 3 } },
    ] as never);
    vi.mocked(productRepository.findProductsByIds).mockResolvedValue([
      product({ id: "companion-1" }),
    ]);

    const bundle = await getFrequentlyBoughtTogether("p1");

    expect(bundle?.baseProduct.id).toBe("p1");
    expect(bundle?.companions.map((c) => c.id)).toEqual(["companion-1"]);
  });
});

describe("getTrendingProducts", () => {
  it("uses real sales-velocity data when there's enough of it", async () => {
    vi.mocked(recommendationsRepository.findTrendingCounts).mockResolvedValue([
      { productId: "hot-1", _sum: { quantity: 20 } },
      { productId: "hot-2", _sum: { quantity: 15 } },
    ] as never);

    vi.mocked(productRepository.findProductsByIds).mockResolvedValue([
      product({ id: "hot-2" }),
      product({ id: "hot-1" }),
    ]);

    const result = await getTrendingProducts(2);

    expect(result.map((p) => p.id)).toEqual(["hot-1", "hot-2"]);
    expect(productRepository.findProducts).not.toHaveBeenCalled();
  });

  it("backfills with the newest products when there isn't enough order history yet", async () => {
    vi.mocked(recommendationsRepository.findTrendingCounts).mockResolvedValue([
      { productId: "hot-1", _sum: { quantity: 3 } },
    ] as never);

    vi.mocked(productRepository.findProductsByIds).mockResolvedValue([
      product({ id: "hot-1" }),
    ]);

    vi.mocked(productRepository.findProducts).mockResolvedValue([
      product({ id: "newest-1" }),
      product({ id: "newest-2" }),
      product({ id: "newest-3" }),
    ]);

    const result = await getTrendingProducts(4);

    expect(result.map((p) => p.id)).toEqual([
      "hot-1",
      "newest-1",
      "newest-2",
      "newest-3",
    ]);
    expect(productRepository.findProducts).toHaveBeenCalledWith(
      { id: { notIn: ["hot-1"] } },
      { createdAt: "desc" },
      undefined,
      3
    );
  });
});

describe("getRecommendedForYou", () => {
  it("returns null when the customer has no purchase history yet", async () => {
    vi.mocked(recommendationsRepository.findPurchasedProductCategories).mockResolvedValue([]);

    await expect(getRecommendedForYou("user-1")).resolves.toBeNull();
  });

  it("recommends from the customer's most-purchased category, excluding already-purchased products", async () => {
    vi.mocked(recommendationsRepository.findPurchasedProductCategories).mockResolvedValue([
      { product: { id: "bought-1", category: "snacks" } },
      { product: { id: "bought-2", category: "snacks" } },
      { product: { id: "bought-3", category: "drinks" } },
    ] as never);

    vi.mocked(recommendationsRepository.findCategoryPool)
      .mockResolvedValueOnce([product({ id: "new-snack", category: "snacks" })])
      .mockResolvedValue([]);

    const result = await getRecommendedForYou("user-1");

    expect(result?.map((p) => p.id)).toEqual(["new-snack"]);
    expect(recommendationsRepository.findCategoryPool).toHaveBeenCalledWith(
      "snacks",
      expect.arrayContaining(["bought-1", "bought-2", "bought-3"]),
      expect.any(Number)
    );
  });
});

describe("getCartCrossSell", () => {
  it("returns an empty list for an empty cart", async () => {
    await expect(getCartCrossSell([])).resolves.toEqual([]);
    expect(recommendationsRepository.findOrderIdsContainingProduct).not.toHaveBeenCalled();
  });

  it("aggregates co-purchase scores across every distinct cart item, excluding items already in the cart", async () => {
    vi.mocked(recommendationsRepository.findOrderIdsContainingProduct)
      .mockResolvedValueOnce([{ orderId: "order-1" }] as never)
      .mockResolvedValueOnce([{ orderId: "order-2" }] as never);

    vi.mocked(recommendationsRepository.findCoPurchaseCounts)
      .mockResolvedValueOnce([{ productId: "A", _count: { productId: 2 } }] as never)
      .mockResolvedValueOnce([
        { productId: "B", _count: { productId: 5 } },
        { productId: "A", _count: { productId: 1 } },
      ] as never);

    vi.mocked(productRepository.findProductsByIds)
      .mockResolvedValueOnce([product({ id: "A" })])
      .mockResolvedValueOnce([product({ id: "B" }), product({ id: "A" })]);

    const result = await getCartCrossSell(["cart-1", "cart-2"]);

    // A is recommended by both cart items (score 2), B only by one (score 1).
    expect(result.map((p) => p.id)).toEqual(["A", "B"]);
  });

  it("falls back to trending products when none of the cart's items have co-purchase history", async () => {
    vi.mocked(recommendationsRepository.findOrderIdsContainingProduct).mockResolvedValue([]);
    vi.mocked(recommendationsRepository.findTrendingCounts).mockResolvedValue([
      { productId: "trend-1", _sum: { quantity: 10 } },
    ] as never);
    vi.mocked(productRepository.findProductsByIds).mockResolvedValue([
      product({ id: "trend-1" }),
    ]);
    vi.mocked(productRepository.findProducts).mockResolvedValue([]);

    const result = await getCartCrossSell(["cart-1"], 1);

    expect(result.map((p) => p.id)).toEqual(["trend-1"]);
  });
});

describe("getHealthierAlternatives", () => {
  it("returns an empty list when the reference product doesn't exist", async () => {
    vi.mocked(productRepository.findProductById).mockResolvedValue(null);

    await expect(getHealthierAlternatives("missing")).resolves.toEqual([]);
    expect(recommendationsRepository.findCategoryPool).not.toHaveBeenCalled();
  });

  it("only surfaces same-category candidates with strictly more real dietary attributes", async () => {
    vi.mocked(productRepository.findProductById).mockResolvedValue(
      product({ id: "p1", category: "snacks", organicCertified: false, vegan: false })
    );

    const lateral = product({ id: "lateral", category: "snacks", organicCertified: false, vegan: false });
    const healthier = product({ id: "healthier", category: "snacks", organicCertified: true, vegan: true });

    vi.mocked(recommendationsRepository.findCategoryPool).mockResolvedValue([lateral, healthier]);

    const result = await getHealthierAlternatives("p1");

    expect(result.map((p) => p.id)).toEqual(["healthier"]);
  });

  it("returns an empty list when nothing in the category is genuinely healthier", async () => {
    vi.mocked(productRepository.findProductById).mockResolvedValue(
      product({ id: "p1", category: "snacks", organicCertified: true, vegan: true, glutenFree: true })
    );

    vi.mocked(recommendationsRepository.findCategoryPool).mockResolvedValue([
      product({ id: "same", category: "snacks", organicCertified: true, vegan: true }),
    ]);

    await expect(getHealthierAlternatives("p1")).resolves.toEqual([]);
  });
});

describe("getSeasonalRecommendations", () => {
  beforeEach(() => {
    vi.mocked(filtering.findFilteredProducts).mockReset().mockResolvedValue([]);
  });

  it("maps December to Winter Wellness and searches with real winter keywords", async () => {
    const result = await getSeasonalRecommendations(8, new Date("2026-12-15"));

    expect(result.label).toBe("Winter Wellness");
    expect(filtering.findFilteredProducts).toHaveBeenCalledWith(
      expect.objectContaining({ search: expect.stringContaining("immunity") })
    );
  });

  it("maps April to Summer Refreshers", async () => {
    const result = await getSeasonalRecommendations(8, new Date("2026-04-15"));

    expect(result.label).toBe("Summer Refreshers");
    expect(filtering.findFilteredProducts).toHaveBeenCalledWith(
      expect.objectContaining({ search: expect.stringContaining("cooling") })
    );
  });

  it("maps July to Monsoon Care", async () => {
    const result = await getSeasonalRecommendations(8, new Date("2026-07-15"));

    expect(result.label).toBe("Monsoon Care");
  });

  it("maps October to Festive Season", async () => {
    const result = await getSeasonalRecommendations(8, new Date("2026-10-15"));

    expect(result.label).toBe("Festive Season");
    expect(filtering.findFilteredProducts).toHaveBeenCalledWith(
      expect.objectContaining({ search: expect.stringContaining("festive") })
    );
  });

  it("returns whatever real products the search pipeline finds, respecting the limit", async () => {
    vi.mocked(filtering.findFilteredProducts).mockResolvedValue([
      product({ id: "a" }),
      product({ id: "b" }),
    ] as never);

    const result = await getSeasonalRecommendations(2, new Date("2026-12-15"));

    expect(result.products.map((p) => p.id)).toEqual(["a", "b"]);
    expect(filtering.findFilteredProducts).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, pageSize: 2 })
    );
  });
});
