import { NextResponse } from "next/server";
import { getAdminSession } from "@/features/auth/service";
import * as loyaltyService from "@/features/loyalty/service";
import { LoyaltyValidationError } from "@/features/loyalty/errors";

export async function GET() {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [config, tiers] = await Promise.all([
    loyaltyService.getConfig(),
    loyaltyService.listMembershipTiers(),
  ]);

  return NextResponse.json({ config, tiers });
}

export async function PUT(req: Request) {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const config = await loyaltyService.updateConfig(body);

    return NextResponse.json({ success: true, config });
  } catch (error) {
    if (error instanceof LoyaltyValidationError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    throw error;
  }
}
