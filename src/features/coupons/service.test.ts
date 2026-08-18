import { describe, it, expect, vi, beforeEach } from "vitest";
import { CouponValidationError } from "@/features/coupons/errors";

vi.mock("@/features/coupons/repository", () => ({
  findActiveCouponByCode: vi.fn(),
  findAllCoupons: vi.fn(),
  findActiveCoupons: vi.fn(),
  createCoupon: vi.fn((data) => ({ id: "coupon-1", ...data })),
  deleteCoupon: vi.fn(),
  setCouponActive: vi.fn(),
  countRedemptionsForCoupon: vi.fn(() => 0),
  countRedemptionsForCouponByUser: vi.fn(() => 0),
  createCouponRedemption: vi.fn((data) => ({ id: "redemption-1", ...data })),
}));

import * as couponRepository from "@/features/coupons/repository";
import {
  validateCoupon,
  createCoupon,
  listActiveCoupons,
  recordCouponRedemption,
} from "@/features/coupons/service";

const ACTIVE_COUPON = {
  id: "coupon-1",
  code: "SAVE10",
  type: "fixed",
  value: 10,
  active: true,
  minOrderAmount: 0,
  expiresAt: null as Date | null,
  maxRedemptions: null as number | null,
  perUserLimit: null as number | null,
  createdAt: new Date(),
};

beforeEach(() => {
  vi.mocked(couponRepository.findActiveCouponByCode).mockReset();
  vi.mocked(couponRepository.countRedemptionsForCoupon).mockReset().mockResolvedValue(0);
  vi.mocked(couponRepository.countRedemptionsForCouponByUser).mockReset().mockResolvedValue(0);
  vi.mocked(couponRepository.createCouponRedemption).mockClear();
});

describe("validateCoupon", () => {
  it("rejects a code that doesn't match any active coupon", async () => {
    vi.mocked(couponRepository.findActiveCouponByCode).mockResolvedValue(null);

    await expect(validateCoupon("FAKE", 100)).rejects.toThrow(
      CouponValidationError
    );
  });

  it("rejects an expired coupon", async () => {
    vi.mocked(couponRepository.findActiveCouponByCode).mockResolvedValue({
      ...ACTIVE_COUPON,
      expiresAt: new Date("2020-01-01"),
    });

    await expect(validateCoupon("SAVE10", 100)).rejects.toThrow(
      CouponValidationError
    );
  });

  it("rejects an order below the coupon's minimum amount", async () => {
    vi.mocked(couponRepository.findActiveCouponByCode).mockResolvedValue({
      ...ACTIVE_COUPON,
      minOrderAmount: 500,
    });

    await expect(validateCoupon("SAVE10", 100)).rejects.toThrow(
      CouponValidationError
    );
  });

  it("computes a fixed discount", async () => {
    vi.mocked(couponRepository.findActiveCouponByCode).mockResolvedValue(
      ACTIVE_COUPON
    );

    await expect(validateCoupon("SAVE10", 100)).resolves.toEqual({
      id: "coupon-1",
      code: "SAVE10",
      discount: 10,
    });
  });

  it("computes a percent discount", async () => {
    vi.mocked(couponRepository.findActiveCouponByCode).mockResolvedValue({
      ...ACTIVE_COUPON,
      type: "percent",
      value: 20,
    });

    await expect(validateCoupon("SAVE10", 100)).resolves.toEqual({
      id: "coupon-1",
      code: "SAVE10",
      discount: 20,
    });
  });

  it("never discounts more than the subtotal", async () => {
    vi.mocked(couponRepository.findActiveCouponByCode).mockResolvedValue({
      ...ACTIVE_COUPON,
      type: "fixed",
      value: 999,
    });

    await expect(validateCoupon("SAVE10", 100)).resolves.toEqual({
      id: "coupon-1",
      code: "SAVE10",
      discount: 100,
    });
  });

  it("rejects once the coupon's total usage limit is reached", async () => {
    vi.mocked(couponRepository.findActiveCouponByCode).mockResolvedValue({
      ...ACTIVE_COUPON,
      maxRedemptions: 2,
    });
    vi.mocked(couponRepository.countRedemptionsForCoupon).mockResolvedValue(2);

    await expect(validateCoupon("SAVE10", 100)).rejects.toThrow(
      CouponValidationError
    );
  });

  it("allows redemption while under the total usage limit", async () => {
    vi.mocked(couponRepository.findActiveCouponByCode).mockResolvedValue({
      ...ACTIVE_COUPON,
      maxRedemptions: 2,
    });
    vi.mocked(couponRepository.countRedemptionsForCoupon).mockResolvedValue(1);

    await expect(validateCoupon("SAVE10", 100)).resolves.toEqual({
      id: "coupon-1",
      code: "SAVE10",
      discount: 10,
    });
  });

  it("rejects once a specific customer has hit their per-user limit", async () => {
    vi.mocked(couponRepository.findActiveCouponByCode).mockResolvedValue({
      ...ACTIVE_COUPON,
      perUserLimit: 1,
    });
    vi.mocked(couponRepository.countRedemptionsForCouponByUser).mockResolvedValue(1);

    await expect(validateCoupon("SAVE10", 100, "user-1")).rejects.toThrow(
      CouponValidationError
    );
  });

  it("does not enforce the per-user limit for a guest checkout (no userId)", async () => {
    vi.mocked(couponRepository.findActiveCouponByCode).mockResolvedValue({
      ...ACTIVE_COUPON,
      perUserLimit: 1,
    });

    await expect(validateCoupon("SAVE10", 100)).resolves.toEqual({
      id: "coupon-1",
      code: "SAVE10",
      discount: 10,
    });
    expect(couponRepository.countRedemptionsForCouponByUser).not.toHaveBeenCalled();
  });
});

describe("recordCouponRedemption", () => {
  it("delegates to the repository with the given coupon, user, and order ids", async () => {
    await recordCouponRedemption("coupon-1", "user-1", "order-1");

    expect(couponRepository.createCouponRedemption).toHaveBeenCalledWith({
      couponId: "coupon-1",
      userId: "user-1",
      orderId: "order-1",
    });
  });
});

describe("createCoupon", () => {
  it("rejects a missing code", () => {
    expect(() =>
      createCoupon({ code: "", type: "fixed", value: 10 })
    ).toThrow(CouponValidationError);
  });

  it("rejects an invalid type", () => {
    expect(() =>
      createCoupon({ code: "X", type: "bogus", value: 10 })
    ).toThrow(CouponValidationError);
  });

  it("rejects a non-positive value", () => {
    expect(() =>
      createCoupon({ code: "X", type: "fixed", value: 0 })
    ).toThrow(CouponValidationError);
  });

  it("uppercases the code", () => {
    createCoupon({ code: "save10", type: "fixed", value: 10 });

    expect(couponRepository.createCoupon).toHaveBeenCalledWith(
      expect.objectContaining({ code: "SAVE10" })
    );
  });

  it("defaults maxRedemptions and perUserLimit to null when omitted", () => {
    createCoupon({ code: "save10", type: "fixed", value: 10 });

    expect(couponRepository.createCoupon).toHaveBeenCalledWith(
      expect.objectContaining({ maxRedemptions: null, perUserLimit: null })
    );
  });

  it("passes through valid usage-limit values", () => {
    createCoupon({
      code: "save10",
      type: "fixed",
      value: 10,
      maxRedemptions: 100,
      perUserLimit: 1,
    });

    expect(couponRepository.createCoupon).toHaveBeenCalledWith(
      expect.objectContaining({ maxRedemptions: 100, perUserLimit: 1 })
    );
  });

  it("rejects a non-integer maxRedemptions", () => {
    expect(() =>
      createCoupon({ code: "X", type: "fixed", value: 10, maxRedemptions: 1.5 })
    ).toThrow(CouponValidationError);
  });

  it("rejects a zero perUserLimit", () => {
    expect(() =>
      createCoupon({ code: "X", type: "fixed", value: 10, perUserLimit: 0 })
    ).toThrow(CouponValidationError);
  });
});

describe("listActiveCoupons", () => {
  it("delegates to the repository's active-coupons query", async () => {
    vi.mocked(couponRepository.findActiveCoupons).mockResolvedValue([
      ACTIVE_COUPON,
    ]);

    await expect(listActiveCoupons()).resolves.toEqual([ACTIVE_COUPON]);
  });
});
