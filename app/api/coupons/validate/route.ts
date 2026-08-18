import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/features/auth/auth-options";
import * as couponService from "@/features/coupons/service";
import { CouponValidationError } from "@/features/coupons/errors";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json();
    const subtotal = Number(body.subtotal) || 0;

    const result = await couponService.validateCoupon(
      body.code,
      subtotal,
      session?.user?.id
    );

    return NextResponse.json({ success: true, ...result });
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
