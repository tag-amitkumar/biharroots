import { describe, it, expect, vi, beforeEach } from "vitest";
import { RecentlyViewedValidationError } from "@/features/recently-viewed/errors";

vi.mock("@/features/recently-viewed/repository", () => ({
  upsertView: vi.fn(),
  findRecentForUser: vi.fn(),
}));

import * as recentlyViewedRepository from "@/features/recently-viewed/repository";
import { recordView, getRecentlyViewed } from "@/features/recently-viewed/service";

beforeEach(() => {
  vi.mocked(recentlyViewedRepository.upsertView).mockReset();
  vi.mocked(recentlyViewedRepository.findRecentForUser).mockReset();
});

describe("recordView", () => {
  it("rejects a missing userId or productId", () => {
    expect(() => recordView("", "product-1")).toThrow(RecentlyViewedValidationError);
    expect(() => recordView("user-1", "")).toThrow(RecentlyViewedValidationError);
  });

  it("delegates to the repository's upsert", () => {
    recordView("user-1", "product-1");

    expect(recentlyViewedRepository.upsertView).toHaveBeenCalledWith("user-1", "product-1");
  });
});

describe("getRecentlyViewed", () => {
  it("excludes the given product id from the result", async () => {
    vi.mocked(recentlyViewedRepository.findRecentForUser).mockResolvedValue([
      { id: "rv-1", userId: "user-1", productId: "current", viewedAt: new Date(), product: { id: "current" } },
      { id: "rv-2", userId: "user-1", productId: "other", viewedAt: new Date(), product: { id: "other" } },
    ] as never);

    const result = await getRecentlyViewed("user-1", "current");

    expect(result).toEqual([{ id: "other" }]);
  });

  it("returns the most-recently-viewed products in order when nothing is excluded", async () => {
    vi.mocked(recentlyViewedRepository.findRecentForUser).mockResolvedValue([
      { id: "rv-1", userId: "user-1", productId: "p1", viewedAt: new Date(), product: { id: "p1" } },
      { id: "rv-2", userId: "user-1", productId: "p2", viewedAt: new Date(), product: { id: "p2" } },
    ] as never);

    const result = await getRecentlyViewed("user-1");

    expect(result).toEqual([{ id: "p1" }, { id: "p2" }]);
  });
});
