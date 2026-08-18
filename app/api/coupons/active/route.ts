import { NextResponse } from "next/server";
import * as couponService from "@/features/coupons/service";

export async function GET() {
  const coupons = await couponService.listActiveCoupons();

  return NextResponse.json(
    coupons.map((coupon) => ({
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      minOrderAmount: coupon.minOrderAmount,
      expiresAt: coupon.expiresAt,
    }))
  );
}
