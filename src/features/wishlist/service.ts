import * as wishlistRepository from "@/features/wishlist/repository";
import { WishlistValidationError } from "@/features/wishlist/errors";

export function getWishlistForUser(userId: string) {
  return wishlistRepository.findWishlistForUser(userId);
}

export function addToWishlist(userId: string, productId: string) {
  return wishlistRepository.addToWishlist(userId, productId);
}

export function removeFromWishlist(userId: string, productId: string) {
  return wishlistRepository.removeFromWishlist(userId, productId);
}

// Lazily generated on first share request, same spirit as referral codes -
// most customers never share their wishlist, so there's no reason to burn a
// token (or a DB write) for every account. Opaque and long (unlike a
// referral code) since this one grants read access to someone's data
// rather than being typed in by hand.
export async function getOrCreateShareToken(userId: string) {
  const user = await wishlistRepository.findUserById(userId);

  if (!user) {
    throw new WishlistValidationError("User not found");
  }

  if (user.wishlistShareToken) {
    return user.wishlistShareToken;
  }

  const token = crypto.randomUUID().replace(/-/g, "");
  await wishlistRepository.setWishlistShareToken(userId, token);

  return token;
}

export async function getSharedWishlist(token: string) {
  const user = await wishlistRepository.findUserByShareToken(token);

  if (!user) return null;

  const items = await wishlistRepository.findWishlistForUser(user.id);

  return { ownerName: user.name, items };
}

export async function getWishlistInsights(userId: string) {
  const items = await wishlistRepository.findWishlistForUser(userId);

  const totalItems = items.length;
  const totalValue = items.reduce((sum, item) => sum + item.product.price, 0);
  const inStockCount = items.filter((item) => item.product.stock > 0).length;

  const categoryCounts = new Map<string, number>();
  items.forEach((item) => {
    const category = item.product.category;
    categoryCounts.set(category, (categoryCounts.get(category) || 0) + 1);
  });

  const topCategory =
    [...categoryCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  return {
    totalItems,
    totalValue,
    averagePrice: totalItems > 0 ? Math.round(totalValue / totalItems) : 0,
    inStockCount,
    outOfStockCount: totalItems - inStockCount,
    topCategory,
  };
}
