import { describe, it, expect, vi, beforeEach } from "vitest";
import { ReviewValidationError } from "@/features/reviews/errors";

vi.mock("@/features/reviews/repository", () => ({
  createReview: vi.fn((data) => ({ id: "review-1", ...data })),
  findReviewsByProduct: vi.fn(),
  getRatingSummaries: vi.fn(),
  getRatingSummaryForProduct: vi.fn(),
  findFeaturedReviews: vi.fn(),
  findReviewSummary: vi.fn(),
  upsertReviewSummary: vi.fn(),
}));

vi.mock("@/features/wallet/service", () => ({
  earnCoins: vi.fn(),
}));

vi.mock("@/features/loyalty/service", () => ({
  getConfig: vi.fn(() => ({ reviewBonus: 20 })),
}));

vi.mock("@/features/ai/service", async () => {
  const actual = await vi.importActual<typeof import("@/features/ai/service")>("@/features/ai/service");

  return {
    ...actual,
    generateChatCompletion: vi.fn(),
    isAIConfigured: vi.fn(() => false),
  };
});

import * as reviewRepository from "@/features/reviews/repository";
import * as walletService from "@/features/wallet/service";
import * as loyaltyService from "@/features/loyalty/service";
import * as aiService from "@/features/ai/service";
import {
  submitReview,
  getRatingSummaries,
  getFeaturedReviews,
  getRatingSummary,
  getReviewSummary,
} from "@/features/reviews/service";

const VALID_INPUT = {
  productId: "prod-1",
  userId: "user-1",
  rating: 5,
  comment: "Great!",
};

beforeEach(() => {
  vi.mocked(reviewRepository.createReview).mockClear();
  vi.mocked(walletService.earnCoins).mockClear();
  vi.mocked(loyaltyService.getConfig).mockClear();
  vi.mocked(reviewRepository.findReviewsByProduct).mockReset();
  vi.mocked(reviewRepository.findReviewSummary).mockReset();
  vi.mocked(reviewRepository.upsertReviewSummary).mockReset();
  vi.mocked(aiService.generateChatCompletion).mockReset();
  vi.mocked(aiService.isAIConfigured).mockReset().mockReturnValue(false);
});

describe("submitReview", () => {
  it("rejects a review missing a rating", async () => {
    await expect(
      submitReview({ ...VALID_INPUT, rating: 0 })
    ).rejects.toThrow(ReviewValidationError);
  });

  it("rejects a review missing a comment", async () => {
    await expect(
      submitReview({ ...VALID_INPUT, comment: "" })
    ).rejects.toThrow(ReviewValidationError);
  });

  it("rejects a review missing a productId", async () => {
    await expect(
      submitReview({ ...VALID_INPUT, productId: "" })
    ).rejects.toThrow(ReviewValidationError);
  });

  it("creates the review, attributing it to the given userId", async () => {
    await submitReview(VALID_INPUT);

    expect(reviewRepository.createReview).toHaveBeenCalledWith(VALID_INPUT);
  });

  it("awards the configured NatureCoin review bonus", async () => {
    await submitReview(VALID_INPUT);

    expect(walletService.earnCoins).toHaveBeenCalledWith(
      "user-1",
      20,
      "review",
      expect.objectContaining({ note: expect.any(String) })
    );
  });

  it("skips the bonus entirely when reviewBonus is configured to 0", async () => {
    vi.mocked(loyaltyService.getConfig).mockResolvedValue({ reviewBonus: 0 } as never);

    await submitReview(VALID_INPUT);

    expect(walletService.earnCoins).not.toHaveBeenCalled();
  });
});

describe("getRatingSummaries", () => {
  it("maps grouped Prisma aggregates into a flat productId/avgRating/reviewCount shape", async () => {
    vi.mocked(reviewRepository.getRatingSummaries).mockResolvedValue([
      { productId: "prod-1", _avg: { rating: 4.5 }, _count: { rating: 2 } },
    ] as never);

    await expect(getRatingSummaries()).resolves.toEqual([
      { productId: "prod-1", avgRating: 4.5, reviewCount: 2 },
    ]);
  });
});

describe("getRatingSummary", () => {
  it("delegates to the single-product aggregate query", async () => {
    vi.mocked(reviewRepository.getRatingSummaryForProduct).mockResolvedValue({
      avgRating: 4.5,
      reviewCount: 2,
    });

    await expect(getRatingSummary("prod-1")).resolves.toEqual({
      avgRating: 4.5,
      reviewCount: 2,
    });

    expect(reviewRepository.getRatingSummaryForProduct).toHaveBeenCalledWith("prod-1");
  });
});

describe("getFeaturedReviews", () => {
  it("flattens the joined user/product relations into plain display fields", async () => {
    vi.mocked(reviewRepository.findFeaturedReviews).mockResolvedValue([
      {
        id: "review-1",
        rating: 5,
        comment: "Great!",
        createdAt: new Date("2026-01-01"),
        user: { name: "Jane" },
        product: { name: "Organic Avocado", image: "avocado.jpg" },
      },
    ] as never);

    await expect(getFeaturedReviews(6)).resolves.toEqual([
      {
        id: "review-1",
        rating: 5,
        comment: "Great!",
        createdAt: new Date("2026-01-01"),
        customerName: "Jane",
        productName: "Organic Avocado",
        productImage: "avocado.jpg",
      },
    ]);

    expect(reviewRepository.findFeaturedReviews).toHaveBeenCalledWith(6);
  });
});

describe("getReviewSummary", () => {
  it("returns an honest zero-review state without touching the cache or the AI provider", async () => {
    vi.mocked(reviewRepository.findReviewsByProduct).mockResolvedValue([]);

    const result = await getReviewSummary("prod-1");

    expect(result).toEqual({
      reviewCount: 0,
      avgRating: 0,
      sentiment: "No reviews yet",
      recommendationScore: 0,
      pros: [],
      cons: [],
      aiSummary: null,
      source: "rule",
    });
    expect(reviewRepository.findReviewSummary).not.toHaveBeenCalled();
    expect(aiService.generateChatCompletion).not.toHaveBeenCalled();
  });

  it("computes and caches the deterministic summary when no AI provider is configured", async () => {
    vi.mocked(reviewRepository.findReviewsByProduct).mockResolvedValue([
      { rating: 5, comment: "Great packaging" },
      { rating: 5, comment: "Loved the packaging" },
    ] as never);
    vi.mocked(reviewRepository.findReviewSummary).mockResolvedValue(null);

    const result = await getReviewSummary("prod-1");

    expect(result.source).toBe("rule");
    expect(result.aiSummary).toBeNull();
    expect(result.sentiment).toBe("Overwhelmingly Positive");
    expect(aiService.generateChatCompletion).not.toHaveBeenCalled();
    expect(reviewRepository.upsertReviewSummary).toHaveBeenCalledWith(
      "prod-1",
      expect.objectContaining({ reviewCountAtGeneration: 2, source: "rule" })
    );
  });

  it("returns the cached summary as-is when the review count hasn't changed", async () => {
    vi.mocked(reviewRepository.findReviewsByProduct).mockResolvedValue([
      { rating: 5, comment: "Great" },
      { rating: 4, comment: "Good" },
    ] as never);
    vi.mocked(reviewRepository.findReviewSummary).mockResolvedValue({
      id: "sum-1",
      productId: "prod-1",
      reviewCountAtGeneration: 2,
      avgRatingAtGeneration: 4.5,
      sentiment: "Mostly Positive",
      recommendationScore: 100,
      pros: JSON.stringify(["quality"]),
      cons: JSON.stringify([]),
      aiSummary: null,
      source: "rule",
      updatedAt: new Date(),
    } as never);

    const result = await getReviewSummary("prod-1");

    expect(result.pros).toEqual(["quality"]);
    expect(reviewRepository.upsertReviewSummary).not.toHaveBeenCalled();
  });

  it("recomputes when a new review has been added since the cache was generated", async () => {
    vi.mocked(reviewRepository.findReviewsByProduct).mockResolvedValue([
      { rating: 5, comment: "Great" },
      { rating: 4, comment: "Good" },
      { rating: 5, comment: "Excellent" },
    ] as never);
    vi.mocked(reviewRepository.findReviewSummary).mockResolvedValue({
      id: "sum-1",
      productId: "prod-1",
      reviewCountAtGeneration: 2,
      avgRatingAtGeneration: 4.5,
      sentiment: "Mostly Positive",
      recommendationScore: 100,
      pros: JSON.stringify(["quality"]),
      cons: JSON.stringify([]),
      aiSummary: null,
      source: "rule",
      updatedAt: new Date(),
    } as never);

    await getReviewSummary("prod-1");

    expect(reviewRepository.upsertReviewSummary).toHaveBeenCalledWith(
      "prod-1",
      expect.objectContaining({ reviewCountAtGeneration: 3 })
    );
  });

  it("produces an AI-enhanced summary and marks the source as llm when a provider is configured", async () => {
    vi.mocked(reviewRepository.findReviewsByProduct).mockResolvedValue([
      { rating: 5, comment: "Great packaging" },
      { rating: 4, comment: "Good quality" },
    ] as never);
    vi.mocked(reviewRepository.findReviewSummary).mockResolvedValue(null);
    vi.mocked(aiService.isAIConfigured).mockReturnValue(true);
    vi.mocked(aiService.generateChatCompletion).mockResolvedValue(
      JSON.stringify({
        summary: "Customers love the packaging and quality.",
        pros: ["great packaging"],
        cons: [],
      })
    );

    const result = await getReviewSummary("prod-1");

    expect(result.source).toBe("llm");
    expect(result.aiSummary).toBe("Customers love the packaging and quality.");
    expect(result.pros).toEqual(["great packaging"]);
    expect(reviewRepository.upsertReviewSummary).toHaveBeenCalledWith(
      "prod-1",
      expect.objectContaining({ source: "llm" })
    );
  });

  it("falls back to the deterministic summary instead of crashing when the AI provider errors", async () => {
    vi.mocked(reviewRepository.findReviewsByProduct).mockResolvedValue([
      { rating: 5, comment: "Great packaging" },
      { rating: 4, comment: "Good quality" },
    ] as never);
    vi.mocked(reviewRepository.findReviewSummary).mockResolvedValue(null);
    vi.mocked(aiService.isAIConfigured).mockReturnValue(true);
    vi.mocked(aiService.generateChatCompletion).mockRejectedValue(new Error("network down"));

    const result = await getReviewSummary("prod-1");

    expect(result.source).toBe("rule");
    expect(result.aiSummary).toBeNull();
  });
});
