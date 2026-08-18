import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/features/products/repository", () => ({
  findProducts: vi.fn(),
  findSalesCounts: vi.fn(),
  findDistinctBrands: vi.fn(() => []),
}));

vi.mock("@/features/reviews/repository", () => ({
  getRatingSummaries: vi.fn(),
}));

import * as productRepository from "@/features/products/repository";
import * as reviewRepository from "@/features/reviews/repository";
import { findFilteredProducts, parseProductFilterParams } from "@/features/products/filtering";

function product(
  overrides: Partial<{ id: string; name: string; price: number; mrp: number | null }>
) {
  return { id: "p1", name: "Product", price: 100, mrp: null, ...overrides };
}

beforeEach(() => {
  vi.mocked(productRepository.findProducts).mockReset().mockResolvedValue([]);
  vi.mocked(productRepository.findSalesCounts).mockReset().mockResolvedValue([]);
  vi.mocked(productRepository.findDistinctBrands).mockReset().mockResolvedValue([]);
  vi.mocked(reviewRepository.getRatingSummaries).mockReset().mockResolvedValue([]);
});

describe("findFilteredProducts - simple sorts", () => {
  it("uses a direct DB query with pagination for newest (the default)", async () => {
    await findFilteredProducts({ page: 1, pageSize: 10 });

    expect(productRepository.findProducts).toHaveBeenCalledWith(
      expect.anything(),
      { createdAt: "desc" },
      0,
      10
    );
  });

  it("sorts by featured first for the 'featured' sort", async () => {
    await findFilteredProducts({ sort: "featured" });

    expect(productRepository.findProducts).toHaveBeenCalledWith(
      expect.anything(),
      { featured: "desc" },
      undefined,
      undefined
    );
  });

  it("builds a where clause including every simple structured filter", async () => {
    await findFilteredProducts({
      minPrice: 50,
      maxPrice: 200,
      brand: "NatureCart",
      availability: "in-stock",
      organicCertified: true,
      countryOfOrigin: "India",
    });

    expect(productRepository.findProducts).toHaveBeenCalledWith(
      {
        AND: expect.arrayContaining([
          { price: { gte: 50 } },
          { price: { lte: 200 } },
          { brand: "NatureCart" },
          { stock: { gt: 0 } },
          { organicCertified: true },
          { countryOfOrigin: "India" },
        ]),
      },
      expect.anything(),
      undefined,
      undefined
    );
  });
});

describe("findFilteredProducts - natural-language / fuzzy search", () => {
  it("extracts a budget embedded in the search text and merges it with structured filters", async () => {
    await findFilteredProducts({ search: "snacks under 300" });

    // The NL parser strips "under 300" into maxPrice and leaves "snacks"
    // as the free-text term driving fuzzy matching.
    const finalWhereCall = vi.mocked(productRepository.findProducts).mock.calls.at(-1)![0];
    expect(finalWhereCall).toEqual(
      expect.objectContaining({
        AND: expect.arrayContaining([{ price: { lte: 300 } }]),
      })
    );
  });

  it("fuzzy-matches a typo against real product names instead of requiring an exact substring", async () => {
    // Mimic real DB filtering behavior: the first call (fetching fuzzy
    // candidates) has no id filter yet and returns everything; once Fuse.js
    // narrows it down, the code pushes an `{ id: { in: [...] } }` clause and
    // re-queries - that second call comes back scoped to the match.
    vi.mocked(productRepository.findProducts)
      .mockResolvedValueOnce([
        product({ id: "mango-1", name: "Fresh Alphonso Mango" }),
        product({ id: "soap-1", name: "Herbal Bath Soap" }),
      ] as never)
      .mockResolvedValueOnce([product({ id: "mango-1", name: "Fresh Alphonso Mango" })] as never);

    const result = await findFilteredProducts({ search: "mngo" });

    expect(result.map((p: { id: string }) => p.id)).toEqual(["mango-1"]);
  });

  it("an explicit sort overrides relevance-based ranking but keeps the fuzzy id scoping", async () => {
    vi.mocked(productRepository.findProducts).mockResolvedValue([product({ id: "a" })] as never);

    await findFilteredProducts({ search: "mango", sort: "price-asc" });

    expect(productRepository.findProducts).toHaveBeenLastCalledWith(
      expect.anything(),
      { price: "asc" },
      undefined,
      undefined
    );
  });
});

describe("findFilteredProducts - rating filter", () => {
  it("scopes to products meeting the minimum rating via an id filter", async () => {
    vi.mocked(reviewRepository.getRatingSummaries).mockResolvedValue([
      { productId: "high-rated", _avg: { rating: 4.5 }, _count: { rating: 3 } },
      { productId: "low-rated", _avg: { rating: 2 }, _count: { rating: 3 } },
    ] as never);

    await findFilteredProducts({ rating: 4 });

    expect(productRepository.findProducts).toHaveBeenCalledWith(
      { AND: expect.arrayContaining([{ id: { in: ["high-rated"] } }]) },
      expect.anything(),
      undefined,
      undefined
    );
  });
});

describe("findFilteredProducts - discount filter", () => {
  it("only includes products where mrp is genuinely greater than price", async () => {
    vi.mocked(productRepository.findProducts).mockResolvedValueOnce([
      product({ id: "on-sale", price: 80, mrp: 100 }),
      product({ id: "not-on-sale", price: 100, mrp: 100 }),
    ] as never);

    await findFilteredProducts({ discount: true });

    expect(productRepository.findProducts).toHaveBeenLastCalledWith(
      { AND: expect.arrayContaining([{ id: { in: ["on-sale"] } }]) },
      expect.anything(),
      undefined,
      undefined
    );
  });
});

describe("findFilteredProducts - computed sorts", () => {
  it("ranks by rating and paginates in-memory", async () => {
    vi.mocked(productRepository.findProducts).mockResolvedValue([
      product({ id: "a" }),
      product({ id: "b" }),
      product({ id: "c" }),
    ] as never);
    vi.mocked(reviewRepository.getRatingSummaries).mockResolvedValue([
      { productId: "a", _avg: { rating: 3 }, _count: { rating: 1 } },
      { productId: "b", _avg: { rating: 5 }, _count: { rating: 1 } },
      { productId: "c", _avg: { rating: 4 }, _count: { rating: 1 } },
    ] as never);

    const result = await findFilteredProducts({ sort: "rating", page: 1, pageSize: 2 });

    expect(result.map((p: { id: string }) => p.id)).toEqual(["b", "c"]);
  });

  it("ranks by all-time sales for best-selling", async () => {
    vi.mocked(productRepository.findProducts).mockResolvedValue([
      product({ id: "a" }),
      product({ id: "b" }),
    ] as never);
    vi.mocked(productRepository.findSalesCounts).mockResolvedValue([
      { productId: "a", _sum: { quantity: 2 } },
      { productId: "b", _sum: { quantity: 9 } },
    ] as never);

    const result = await findFilteredProducts({ sort: "best-selling" });

    expect(result.map((p: { id: string }) => p.id)).toEqual(["b", "a"]);
  });

  it("ranks by review count for most-reviewed", async () => {
    vi.mocked(productRepository.findProducts).mockResolvedValue([
      product({ id: "a" }),
      product({ id: "b" }),
    ] as never);
    vi.mocked(reviewRepository.getRatingSummaries).mockResolvedValue([
      { productId: "a", _avg: { rating: 5 }, _count: { rating: 1 } },
      { productId: "b", _avg: { rating: 3 }, _count: { rating: 20 } },
    ] as never);

    const result = await findFilteredProducts({ sort: "most-reviewed" });

    expect(result.map((p: { id: string }) => p.id)).toEqual(["b", "a"]);
  });
});

describe("parseProductFilterParams", () => {
  it("parses boolean flags, numbers, and passes through only known sort values", () => {
    const params = new URLSearchParams({
      organicCertified: "true",
      vegan: "false",
      rating: "4",
      sort: "best-selling",
      page: "2",
      pageSize: "12",
    });

    const parsed = parseProductFilterParams(params);

    expect(parsed.organicCertified).toBe(true);
    expect(parsed.vegan).toBeUndefined();
    expect(parsed.rating).toBe(4);
    expect(parsed.sort).toBe("best-selling");
    expect(parsed.page).toBe(2);
    expect(parsed.pageSize).toBe(12);
  });

  it("ignores an invalid sort value", () => {
    const params = new URLSearchParams({ sort: "bogus" });

    expect(parseProductFilterParams(params).sort).toBeUndefined();
  });
});
