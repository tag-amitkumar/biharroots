import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/features/auth/auth-options";
import * as walletService from "@/features/wallet/service";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const coins = Number(body.coins) || 0;
  const subtotal = Number(body.subtotal) || 0;

  const preview = await walletService.previewRedemption(session.user.id, coins, subtotal);

  return NextResponse.json(preview);
}
