import { describe, it, expect, vi, beforeEach } from "vitest";
import { CategoryValidationError } from "@/features/categories/errors";

vi.mock("@/features/categories/repository", () => ({
  findAllCategories: vi.fn(),
  findEnabledCategories: vi.fn(),
  findMainCategories: vi.fn(),
  findCategoryBySlug: vi.fn(),
  findCategoryById: vi.fn(),
  createCategory: vi.fn((data) => ({ id: "cat-1", viewCount: 0, ...data })),
  updateCategory: vi.fn((id, data) => ({ id, ...data })),
  deleteCategory: vi.fn(),
  countSiblings: vi.fn(() => 0),
  reorderCategories: vi.fn(),
  incrementViewCount: vi.fn(),
  findProductIdsForCategories: vi.fn(),
  findProductsWhereIn: vi.fn(),
  countProductsWhereIn: vi.fn(),
  findCategoriesForProduct: vi.fn(),
  replaceProductCategories: vi.fn(),
  findProductsByIds: vi.fn(),
  findBestSellingProductIdsForCategories: vi.fn(),
}));

vi.mock("@/features/products/repository", () => ({
  findProducts: vi.fn(() => []),
  findSalesCounts: vi.fn(() => []),
}));

vi.mock("@/features/reviews/repository", () => ({
  getRatingSummaries: vi.fn(() => []),
}));

import * as categoryRepository from "@/features/categories/repository";
import * as productRepository from "@/features/products/repository";
import {
  createCategory,
  updateCategory,
  reorderCategories,
  getCategoryAnalytics,
  getCategoryIdsForBrowsing,
  assignCategoriesToProduct,
  getFeaturedProductsForCategory,
  getBestSellersForCategory,
  getTrendingForCategory,
  getProductsForCategorySlug,
} from "@/features/categories/service";

beforeEach(() => {
  vi.mocked(categoryRepository.findCategoryById).mockReset();
  vi.mocked(categoryRepository.createCategory).mockClear();
  vi.mocked(categoryRepository.updateCategory).mockClear();
  vi.mocked(categoryRepository.countSiblings).mockReset().mockResolvedValue(0);
  vi.mocked(categoryRepository.reorderCategories).mockClear();
  vi.mocked(categoryRepository.replaceProductCategories).mockClear();
  vi.mocked(categoryRepository.findProductsWhereIn).mockReset();
  vi.mocked(categoryRepository.findProductsByIds).mockReset();
  vi.mocked(categoryRepository.findBestSellingProductIdsForCategories).mockReset();
});

describe("createCategory", () => {
  it("rejects a missing name", async () => {
    await expect(createCategory({ name: "" })).rejects.toThrow(CategoryValidationError);
  });

  it("slugifies the name for a top-level category", async () => {
    await createCategory({ name: "Fresh Fruits & Veggies" });

    expect(categoryRepository.createCategory).toHaveBeenCalledWith(
      expect.objectContaining({ slug: "fresh-fruits-veggies", parentId: null })
    );
  });

  it("prefixes the slug with the parent's slug for a subcategory", async () => {
    vi.mocked(categoryRepository.findCategoryById).mockResolvedValue({
      id: "parent-1",
      slug: "fruits-vegetables",
      parentId: null,
      children: [],
    } as never);

    await createCategory({ name: "Leafy Greens", parentId: "parent-1" });

    expect(categoryRepository.createCategory).toHaveBeenCalledWith(
      expect.objectContaining({ slug: "fruits-vegetables-leafy-greens", parentId: "parent-1" })
    );
  });

  it("rejects a parentId that doesn't exist", async () => {
    vi.mocked(categoryRepository.findCategoryById).mockResolvedValue(null);

    await expect(
      createCategory({ name: "Sub", parentId: "missing" })
    ).rejects.toThrow(CategoryValidationError);
  });

  it("rejects nesting a subcategory under another subcategory (max 2 levels)", async () => {
    vi.mocked(categoryRepository.findCategoryById).mockResolvedValue({
      id: "sub-1",
      slug: "some-sub",
      parentId: "main-1",
      children: [],
    } as never);

    await expect(
      createCategory({ name: "Too Deep", parentId: "sub-1" })
    ).rejects.toThrow(CategoryValidationError);
  });
});

describe("updateCategory", () => {
  it("rejects updating a category that doesn't exist", async () => {
    vi.mocked(categoryRepository.findCategoryById).mockResolvedValue(null);

    await expect(updateCategory("missing", { name: "X" })).rejects.toThrow(
      CategoryValidationError
    );
  });

  it("rejects a category becoming its own parent", async () => {
    vi.mocked(categoryRepository.findCategoryById).mockResolvedValue({
      id: "cat-1",
      parentId: null,
      children: [],
    } as never);

    await expect(updateCategory("cat-1", { parentId: "cat-1" })).rejects.toThrow(
      CategoryValidationError
    );
  });

  it("rejects moving a category with subcategories under another parent", async () => {
    vi.mocked(categoryRepository.findCategoryById).mockResolvedValue({
      id: "cat-1",
      parentId: null,
      children: [{ id: "child-1" }],
    } as never);

    await expect(
      updateCategory("cat-1", { parentId: "other-main" })
    ).rejects.toThrow(CategoryValidationError);
  });

  it("allows toggling enabled/featured without touching parentId", async () => {
    vi.mocked(categoryRepository.findCategoryById).mockResolvedValue({
      id: "cat-1",
      parentId: null,
      children: [],
    } as never);

    await updateCategory("cat-1", { enabled: false, featured: true });

    expect(categoryRepository.updateCategory).toHaveBeenCalledWith(
      "cat-1",
      expect.objectContaining({ enabled: false, featured: true })
    );
  });
});

describe("reorderCategories", () => {
  it("assigns sequential sortOrder values matching the given order", async () => {
    await reorderCategories(["c", "a", "b"]);

    expect(categoryRepository.reorderCategories).toHaveBeenCalledWith([
      { id: "c", sortOrder: 0 },
      { id: "a", sortOrder: 1 },
      { id: "b", sortOrder: 2 },
    ]);
  });
});

describe("getCategoryAnalytics", () => {
  it("aggregates totals and top lists from all categories", async () => {
    vi.mocked(categoryRepository.findAllCategories).mockResolvedValue([
      { id: "1", name: "A", viewCount: 10, _count: { products: 5 } },
      { id: "2", name: "B", viewCount: 30, _count: { products: 2 } },
    ] as never);

    const analytics = await getCategoryAnalytics();

    expect(analytics.totalCategories).toBe(2);
    expect(analytics.totalViews).toBe(40);
    expect(analytics.totalProducts).toBe(7);
    expect(analytics.topByViews[0]).toEqual({ id: "2", name: "B", viewCount: 30 });
    expect(analytics.topByProducts[0]).toEqual({ id: "1", name: "A", productCount: 5 });
  });
});

describe("getCategoryIdsForBrowsing", () => {
  it("includes the category itself and all of its children", async () => {
    const ids = await getCategoryIdsForBrowsing({
      id: "main-1",
      children: [{ id: "sub-1" }, { id: "sub-2" }],
    });

    expect(ids).toEqual(["main-1", "sub-1", "sub-2"]);
  });

  it("returns just the category id when it has no children", async () => {
    const ids = await getCategoryIdsForBrowsing({ id: "sub-1" });

    expect(ids).toEqual(["sub-1"]);
  });
});

describe("assignCategoriesToProduct", () => {
  it("deduplicates category ids before persisting", async () => {
    await assignCategoriesToProduct("prod-1", ["a", "b", "a"]);

    expect(categoryRepository.replaceProductCategories).toHaveBeenCalledWith("prod-1", ["a", "b"]);
  });
});

describe("getFeaturedProductsForCategory", () => {
  it("queries products flagged featured within the given category ids", async () => {
    vi.mocked(categoryRepository.findProductsWhereIn).mockResolvedValue([
      { id: "p1" },
    ] as never);

    const result = await getFeaturedProductsForCategory(["cat-1", "cat-2"]);

    expect(categoryRepository.findProductsWhereIn).toHaveBeenCalledWith(
      { AND: [{ featured: true }, { categories: { some: { categoryId: { in: ["cat-1", "cat-2"] } } } }] },
      { createdAt: "desc" },
      0,
      8
    );
    expect(result).toEqual([{ id: "p1" }]);
  });
});

describe("getBestSellersForCategory", () => {
  it("hydrates and orders products by all-time sales volume within the category", async () => {
    vi.mocked(categoryRepository.findBestSellingProductIdsForCategories).mockResolvedValue([
      { productId: "hot-1", _sum: { quantity: 10 } },
      { productId: "hot-2", _sum: { quantity: 5 } },
    ] as never);
    vi.mocked(categoryRepository.findProductsByIds).mockResolvedValue([
      { id: "hot-2" },
      { id: "hot-1" },
    ] as never);

    const result = await getBestSellersForCategory(["cat-1"]);

    expect(categoryRepository.findBestSellingProductIdsForCategories).toHaveBeenCalledWith(
      ["cat-1"],
      null,
      8
    );
    expect(result.map((p: { id: string }) => p.id)).toEqual(["hot-1", "hot-2"]);
  });
});

describe("getTrendingForCategory", () => {
  it("uses real recent sales data when there's enough of it", async () => {
    vi.mocked(categoryRepository.findBestSellingProductIdsForCategories).mockResolvedValue([
      { productId: "trend-1", _sum: { quantity: 3 } },
    ] as never);
    vi.mocked(categoryRepository.findProductsByIds).mockResolvedValue([
      { id: "trend-1" },
    ] as never);

    const result = await getTrendingForCategory(["cat-1"], 1);

    expect(result.map((p: { id: string }) => p.id)).toEqual(["trend-1"]);
    expect(categoryRepository.findProductsWhereIn).not.toHaveBeenCalled();
  });

  it("backfills with the newest in-category products when there isn't enough recent sales data", async () => {
    vi.mocked(categoryRepository.findBestSellingProductIdsForCategories).mockResolvedValue([]);
    vi.mocked(categoryRepository.findProductsWhereIn).mockResolvedValue([
      { id: "newest-1" },
    ] as never);

    const result = await getTrendingForCategory(["cat-1"], 1);

    expect(result.map((p: { id: string }) => p.id)).toEqual(["newest-1"]);
  });
});

describe("getProductsForCategorySlug", () => {
  it("returns null for an unknown slug", async () => {
    vi.mocked(categoryRepository.findCategoryBySlug).mockResolvedValue(null);

    await expect(getProductsForCategorySlug("missing", {})).resolves.toBeNull();
  });

  it("returns null for a disabled category, without querying products", async () => {
    vi.mocked(categoryRepository.findCategoryBySlug).mockResolvedValue({
      id: "cat-1",
      enabled: false,
      children: [],
    } as never);

    await expect(getProductsForCategorySlug("disabled-cat", {})).resolves.toBeNull();
    expect(productRepository.findProducts).not.toHaveBeenCalled();
  });

  it("includes a main category's subcategory products in the browsing scope", async () => {
    vi.mocked(categoryRepository.findCategoryBySlug).mockResolvedValue({
      id: "main-1",
      enabled: true,
      children: [{ id: "sub-1" }, { id: "sub-2" }],
    } as never);
    vi.mocked(productRepository.findProducts).mockResolvedValue([{ id: "p1" }] as never);

    const result = await getProductsForCategorySlug("main-cat", { sort: "price-asc" });

    expect(productRepository.findProducts).toHaveBeenCalledWith(
      {
        AND: expect.arrayContaining([
          { categories: { some: { categoryId: { in: ["main-1", "sub-1", "sub-2"] } } } },
        ]),
      },
      { price: "asc" },
      undefined,
      undefined
    );
    expect(result?.products).toEqual([{ id: "p1" }]);
  });
});
