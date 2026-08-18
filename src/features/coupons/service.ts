import * as couponRepository from "@/features/coupons/repository";
import { CouponValidationError } from "@/features/coupons/errors";

export async function validateCoupon(code: string, subtotal: number, userId?: string) {
  const coupon = await couponRepository.findActiveCouponByCode(code);

  if (!coupon) {
    throw new CouponValidationError("Invalid or inactive coupon code");
  }

  if (coupon.expiresAt && coupon.expiresAt < new Date()) {
    throw new CouponValidationError("This coupon has expired");
  }

  if (subtotal < coupon.minOrderAmount) {
    throw new CouponValidationError(
      `This coupon requires a minimum order of ₹${coupon.minOrderAmount}`
    );
  }

  if (coupon.maxRedemptions !== null) {
    const totalRedemptions = await couponRepository.countRedemptionsForCoupon(coupon.id);

    if (totalRedemptions >= coupon.maxRedemptions) {
      throw new CouponValidationError("This coupon has reached its usage limit");
    }
  }

  if (userId && coupon.perUserLimit !== null) {
    const userRedemptions = await couponRepository.countRedemptionsForCouponByUser(
      coupon.id,
      userId
    );

    if (userRedemptions >= coupon.perUserLimit) {
      throw new CouponValidationError("You've already used this coupon the maximum number of times");
    }
  }

  const rawDiscount =
    coupon.type === "percent"
      ? Math.round((subtotal * coupon.value) / 100)
      : coupon.value;

  return {
    id: coupon.id,
    code: coupon.code,
    discount: Math.max(0, Math.min(rawDiscount, subtotal)),
  };
}

// Called once an order has actually been placed - never at preview time -
// so a customer can validate/preview a coupon repeatedly without consuming
// their limited redemption.
export function recordCouponRedemption(couponId: string, userId: string | null, orderId: string) {
  return couponRepository.createCouponRedemption({ couponId, userId, orderId });
}

export function listCoupons() {
  return couponRepository.findAllCoupons();
}

export function listActiveCoupons() {
  return couponRepository.findActiveCoupons();
}

type CreateCouponInput = {
  code: string;
  type: string;
  value: number;
  minOrderAmount?: number;
  expiresAt?: string | null;
  maxRedemptions?: number | null;
  perUserLimit?: number | null;
};

function parsePositiveIntOrNull(value: number | null | undefined, label: string) {
  if (value === null || value === undefined) {
    return null;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed <= 0 || !Number.isInteger(parsed)) {
    throw new CouponValidationError(`${label} must be a positive whole number`);
  }

  return parsed;
}

export function createCoupon(input: CreateCouponInput) {
  const code = input.code?.trim().toUpperCase();
  const value = Number(input.value);

  if (!code) {
    throw new CouponValidationError("Coupon code is required");
  }

  if (input.type !== "percent" && input.type !== "fixed") {
    throw new CouponValidationError("Coupon type must be percent or fixed");
  }

  if (!Number.isFinite(value) || value <= 0) {
    throw new CouponValidationError("Coupon value must be a positive number");
  }

  return couponRepository.createCoupon({
    code,
    type: input.type,
    value,
    minOrderAmount: Number(input.minOrderAmount) || 0,
    expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
    maxRedemptions: parsePositiveIntOrNull(input.maxRedemptions, "Max redemptions"),
    perUserLimit: parsePositiveIntOrNull(input.perUserLimit, "Per-user limit"),
  });
}

export function deleteCoupon(id: string) {
  return couponRepository.deleteCoupon(id);
}

export function setCouponActive(id: string, active: boolean) {
  return couponRepository.setCouponActive(id, active);
}
