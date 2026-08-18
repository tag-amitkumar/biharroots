import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/features/auth/auth-options";
import * as walletService from "@/features/wallet/service";
import * as userService from "@/features/users/service";
import * as membershipService from "@/features/membership/service";

export async function POST() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [user, membership] = await Promise.all([
    userService.getUserById(session.user.id),
    membershipService.getMembershipForUser(session.user.id),
  ]);

  const result = await walletService.claimDailyBonus(
    session.user.id,
    user?.birthday ?? null,
    membership.tier?.birthdayBonus
  );

  await userService.updateLastLogin(session.user.id);

  return NextResponse.json(result);
}
