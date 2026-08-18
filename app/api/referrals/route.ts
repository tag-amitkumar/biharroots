import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/features/auth/auth-options";
import * as referralService from "@/features/referral/service";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [code, history] = await Promise.all([
    referralService.getOrCreateReferralCode(session.user.id),
    referralService.getReferralHistory(session.user.id),
  ]);

  return NextResponse.json({ code, history });
}
