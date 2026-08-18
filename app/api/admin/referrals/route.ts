import { NextResponse } from "next/server";
import { getAdminSession } from "@/features/auth/service";
import * as referralService from "@/features/referral/service";

export async function GET() {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const analytics = await referralService.getReferralAnalytics();

  return NextResponse.json(analytics);
}
