import * as recentlyViewedRepository from "@/features/recently-viewed/repository";
import { RecentlyViewedValidationError } from "@/features/recently-viewed/errors";

// Recorded server-side only for signed-in customers - this is what makes
// viewing history survive a logout/login or a switch to a new device,
// unlike the localStorage-only store guests fall back to.
export function recordView(userId: string, productId: string) {
  if (!userId || !productId) {
    throw new RecentlyViewedValidationError("userId and productId are required");
  }

  return recentlyViewedRepository.upsertView(userId, productId);
}

export async function getRecentlyViewed(userId: string, excludeId?: string, limit = 8) {
  // Fetch one extra in case the current product (excludeId) is itself the
  // most recent view, so excluding it doesn't leave the list one short.
  const rows = await recentlyViewedRepository.findRecentForUser(userId, limit + 1);

  return rows
    .filter((row) => row.productId !== excludeId)
    .slice(0, limit)
    .map((row) => row.product);
}
