import { NextResponse } from "next/server";
import { getAdminSession } from "@/features/auth/service";
import * as loyaltyService from "@/features/loyalty/service";
import { LoyaltyValidationError } from "@/features/loyalty/errors";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const tier = await loyaltyService.updateMembershipTier(id, body);

    return NextResponse.json({ success: true, tier });
  } catch (error) {
    if (error instanceof LoyaltyValidationError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    throw error;
  }
}
