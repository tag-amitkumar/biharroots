import { prisma } from "@/lib/prisma";

export function findReviewsByProduct(productId: string) {
  return prisma.review.findMany({
    where: { productId },
    orderBy: { createdAt: "desc" },
  });
}

export function createReview(data: {
  productId: string;
  userId: string;
  rating: number;
  comment: string;
}) {
  return prisma.review.create({ data });
}

export async function getRatingSummaryForProduct(productId: string) {
  const result = await prisma.review.aggregate({
    where: { productId },
    _avg: { rating: true },
    _count: { rating: true },
  });

  return { avgRating: result._avg.rating || 0, reviewCount: result._count.rating };
}

export function getRatingSummaries() {
  return prisma.review.groupBy({
    by: ["productId"],
    _avg: { rating: true },
    _count: { rating: true },
  });
}

export function findFeaturedReviews(limit: number) {
  return prisma.review.findMany({
    where: { rating: { gte: 4 } },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      user: { select: { name: true } },
      product: { select: { name: true, image: true } },
    },
  });
}

export function findReviewSummary(productId: string) {
  return prisma.reviewSummary.findUnique({ where: { productId } });
}

export function upsertReviewSummary(
  productId: string,
  data: {
    reviewCountAtGeneration: number;
    avgRatingAtGeneration: number;
    sentiment: string;
    recommendationScore: number;
    pros: string;
    cons: string;
    aiSummary: string | null;
    source: string;
  }
) {
  return prisma.reviewSummary.upsert({
    where: { productId },
    create: { productId, ...data },
    update: data,
  });
}
