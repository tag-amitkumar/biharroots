import { NextResponse } from "next/server";
import { getAdminSession } from "@/features/auth/service";
import * as couponService from "@/features/coupons/service";
import { CouponValidationError } from "@/features/coupons/errors";

export async function GET() {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const coupons = await couponService.listCoupons();

  return NextResponse.json(coupons);
}

export async function POST(req: Request) {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const coupon = await couponService.createCoupon(body);

    return NextResponse.json({ success: true, coupon });
  } catch (error) {
    if (error instanceof CouponValidationError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    console.error(error);

    return NextResponse.json({ success: false }, { status: 500 });
  }
}
