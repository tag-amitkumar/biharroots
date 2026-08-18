import * as reviewRepository from "@/features/reviews/repository";
import * as walletService from "@/features/wallet/service";
import * as loyaltyService from "@/features/loyalty/service";
import { ReviewValidationError } from "@/features/reviews/errors";
import { computeDeterministicSummary, DeterministicSummary } from "@/features/reviews/summaryText";
import { generateChatCompletion, isAIConfigured, parseJSONResponse } from "@/features/ai/service";
import { AIProviderNotConfiguredError } from "@/features/ai/errors";

export function getReviewsForProduct(productId: string) {
  return reviewRepository.findReviewsByProduct(productId);
}

export async function submitReview(input: {
  productId: string;
  userId: string;
  rating: number;
  comment: string;
}) {
  if (!input.productId || !input.rating || !input.comment) {
    throw new ReviewValidationError(
      "productId, rating, and comment are required"
    );
  }

  const review = await reviewRepository.createReview(input);

  const config = await loyaltyService.getConfig();

  if (config.reviewBonus > 0) {
    await walletService.earnCoins(input.userId, config.reviewBonus, "review", {
      note: "Thanks for leaving a review!",
    });
  }

  return review;
}

export function getRatingSummary(productId: string) {
  return reviewRepository.getRatingSummaryForProduct(productId);
}

export async function getRatingSummaries() {
  const groups = await reviewRepository.getRatingSummaries();

  return groups.map((group) => ({
    productId: group.productId,
    avgRating: group._avg.rating || 0,
    reviewCount: group._count.rating,
  }));
}

export type ReviewSummaryResult = {
  reviewCount: number;
  avgRating: number;
  sentiment: string;
  recommendationScore: number;
  pros: string[];
  cons: string[];
  aiSummary: string | null;
  source: "rule" | "llm";
};

async function tryGenerateAISummary(
  reviews: { rating: number; comment: string }[],
  deterministic: DeterministicSummary
): Promise<{ aiSummary: string; pros: string[]; cons: string[] } | null> {
  if (!isAIConfigured()) return null;

  const sample = reviews
    .slice(0, 25)
    .map((r) => `(${r.rating}/5) ${r.comment}`)
    .join("\n");

  try {
    const raw = await generateChatCompletion([
      {
        role: "system",
        content:
          "You summarize real e-commerce customer reviews accurately and concisely. " +
          "Respond with JSON only, no prose or markdown fences.",
      },
      {
        role: "user",
        content:
          'Respond with JSON only: {"summary": string, "pros": string[], "cons": string[]}. ' +
          '"summary" is 2-3 concise sentences capturing overall sentiment. "pros" and "cons" are short ' +
          "phrases (3-6 words) drawn only from what reviewers actually said - do not invent anything not " +
          `implied by the reviews.\n\nReviews:\n${sample}`,
      },
    ]);

    const parsed = parseJSONResponse<{ summary?: string; pros?: string[]; cons?: string[] }>(raw);

    if (!parsed.summary) return null;

    return {
      aiSummary: parsed.summary,
      pros: Array.isArray(parsed.pros) && parsed.pros.length > 0 ? parsed.pros : deterministic.pros,
      cons: Array.isArray(parsed.cons) && parsed.cons.length > 0 ? parsed.cons : deterministic.cons,
    };
  } catch (error) {
    if (error instanceof AIProviderNotConfiguredError) return null;

    // Any other failure (network, malformed JSON) - fall back to the
    // deterministic summary rather than surfacing an error to the shopper.
    return null;
  }
}

// Always returns a real, current summary: the deterministic half (rating
// distribution, keyword-frequency pros/cons) is genuine statistics, always
// available. The AI half (a written summary, and AI-refined pros/cons) is
// only produced when a provider is configured - otherwise `source` stays
// "rule" and `aiSummary` stays null, an honest "not AI-generated" signal
// rather than a fake one. Cached in the ReviewSummary table, keyed on
// review count so a new/edited review invalidates and regenerates it.
export async function getReviewSummary(productId: string): Promise<ReviewSummaryResult> {
  const reviews = await reviewRepository.findReviewsByProduct(productId);

  if (reviews.length === 0) {
    return {
      reviewCount: 0,
      avgRating: 0,
      sentiment: "No reviews yet",
      recommendationScore: 0,
      pros: [],
      cons: [],
      aiSummary: null,
      source: "rule",
    };
  }

  const reviewCount = reviews.length;
  const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount;

  const cached = await reviewRepository.findReviewSummary(productId);

  if (cached && cached.reviewCountAtGeneration === reviewCount) {
    return {
      reviewCount,
      avgRating,
      sentiment: cached.sentiment,
      recommendationScore: cached.recommendationScore,
      pros: JSON.parse(cached.pros),
      cons: JSON.parse(cached.cons),
      aiSummary: cached.aiSummary,
      source: cached.source === "llm" ? "llm" : "rule",
    };
  }

  const deterministic = computeDeterministicSummary(reviews);
  const aiResult = await tryGenerateAISummary(reviews, deterministic);

  const result: ReviewSummaryResult = {
    reviewCount,
    avgRating,
    sentiment: deterministic.sentiment,
    recommendationScore: deterministic.recommendationScore,
    pros: aiResult?.pros ?? deterministic.pros,
    cons: aiResult?.cons ?? deterministic.cons,
    aiSummary: aiResult?.aiSummary ?? null,
    source: aiResult ? "llm" : "rule",
  };

  await reviewRepository.upsertReviewSummary(productId, {
    reviewCountAtGeneration: reviewCount,
    avgRatingAtGeneration: avgRating,
    sentiment: result.sentiment,
    recommendationScore: result.recommendationScore,
    pros: JSON.stringify(result.pros),
    cons: JSON.stringify(result.cons),
    aiSummary: result.aiSummary,
    source: result.source,
  });

  return result;
}

export async function getFeaturedReviews(limit = 6) {
  const reviews = await reviewRepository.findFeaturedReviews(limit);

  return reviews.map((review) => ({
    id: review.id,
    rating: review.rating,
    comment: review.comment,
    createdAt: review.createdAt,
    customerName: review.user.name,
    productName: review.product.name,
    productImage: review.product.image,
  }));
}
