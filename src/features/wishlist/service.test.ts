import { describe, it, expect, vi, beforeEach } from "vitest";
import { WishlistValidationError } from "@/features/wishlist/errors";

vi.mock("@/features/wishlist/repository", () => ({
  findWishlistForUser: vi.fn(),
  addToWishlist: vi.fn(),
  removeFromWishlist: vi.fn(),
  findUserById: vi.fn(),
  setWishlistShareToken: vi.fn(),
  findUserByShareToken: vi.fn(),
}));

import * as wishlistRepository from "@/features/wishlist/repository";
import {
  getOrCreateShareToken,
  getSharedWishlist,
  getWishlistInsights,
} from "@/features/wishlist/service";

function wishlistItem(overrides: Partial<{ id: string; price: number; category: string; stock: number }>) {
  return {
    id: overrides.id ?? "item-1",
    userId: "user-1",
    productId: "prod-1",
    product: {
      id: "prod-1",
      name: "Product",
      price: overrides.price ?? 100,
      category: overrides.category ?? "snacks",
      stock: overrides.stock ?? 10,
      image: "",
      description: "",
    },
  };
}

beforeEach(() => {
  vi.mocked(wishlistRepository.findWishlistForUser).mockReset();
  vi.mocked(wishlistRepository.findUserById).mockReset();
  vi.mocked(wishlistRepository.setWishlistShareToken).mockClear();
  vi.mocked(wishlistRepository.findUserByShareToken).mockReset();
});

describe("getOrCreateShareToken", () => {
  it("rejects when the user doesn't exist", async () => {
    vi.mocked(wishlistRepository.findUserById).mockResolvedValue(null);

    await expect(getOrCreateShareToken("missing")).rejects.toThrow(WishlistValidationError);
  });

  it("returns the existing token without generating a new one", async () => {
    vi.mocked(wishlistRepository.findUserById).mockResolvedValue({
      id: "user-1",
      name: "Jane",
      wishlistShareToken: "existing-token",
    } as never);

    const token = await getOrCreateShareToken("user-1");

    expect(token).toBe("existing-token");
    expect(wishlistRepository.setWishlistShareToken).not.toHaveBeenCalled();
  });

  it("generates and persists a new token when none exists", async () => {
    vi.mocked(wishlistRepository.findUserById).mockResolvedValue({
      id: "user-1",
      name: "Jane",
      wishlistShareToken: null,
    } as never);

    const token = await getOrCreateShareToken("user-1");

    expect(token).toMatch(/^[a-f0-9]{32}$/);
    expect(wishlistRepository.setWishlistShareToken).toHaveBeenCalledWith("user-1", token);
  });
});

describe("getSharedWishlist", () => {
  it("returns null for an invalid token", async () => {
    vi.mocked(wishlistRepository.findUserByShareToken).mockResolvedValue(null);

    await expect(getSharedWishlist("bogus")).resolves.toBeNull();
  });

  it("returns the owner's name and items for a valid token", async () => {
    vi.mocked(wishlistRepository.findUserByShareToken).mockResolvedValue({
      id: "user-1",
      name: "Jane",
    } as never);
    vi.mocked(wishlistRepository.findWishlistForUser).mockResolvedValue([
      wishlistItem({}),
    ] as never);

    const result = await getSharedWishlist("valid-token");

    expect(result?.ownerName).toBe("Jane");
    expect(result?.items).toHaveLength(1);
  });
});

describe("getWishlistInsights", () => {
  it("returns zeroed insights for an empty wishlist", async () => {
    vi.mocked(wishlistRepository.findWishlistForUser).mockResolvedValue([]);

    await expect(getWishlistInsights("user-1")).resolves.toEqual({
      totalItems: 0,
      totalValue: 0,
      averagePrice: 0,
      inStockCount: 0,
      outOfStockCount: 0,
      topCategory: null,
    });
  });

  it("computes total value, average price, stock split, and the most common category", async () => {
    vi.mocked(wishlistRepository.findWishlistForUser).mockResolvedValue([
      wishlistItem({ id: "1", price: 100, category: "snacks", stock: 5 }),
      wishlistItem({ id: "2", price: 200, category: "snacks", stock: 0 }),
      wishlistItem({ id: "3", price: 300, category: "drinks", stock: 5 }),
    ] as never);

    const insights = await getWishlistInsights("user-1");

    expect(insights).toEqual({
      totalItems: 3,
      totalValue: 600,
      averagePrice: 200,
      inStockCount: 2,
      outOfStockCount: 1,
      topCategory: "snacks",
    });
  });
});
