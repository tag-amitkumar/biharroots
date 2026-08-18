import { NextResponse } from "next/server";
import { getAdminSession } from "@/features/auth/service";
import * as couponService from "@/features/coupons/service";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();

  const coupon = await couponService.setCouponActive(id, Boolean(body.active));

  return NextResponse.json(coupon);
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  await couponService.deleteCoupon(id);

  return NextResponse.json({ success: true });
}
