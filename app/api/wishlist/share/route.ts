import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/features/auth/auth-options";
import * as wishlistService from "@/features/wishlist/service";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "You must be logged in to share your wishlist" },
      { status: 401 }
    );
  }

  const token = await wishlistService.getOrCreateShareToken(session.user.id);

  return NextResponse.json({ token });
}
