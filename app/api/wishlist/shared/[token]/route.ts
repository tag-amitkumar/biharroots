import { NextResponse } from "next/server";
import * as wishlistService from "@/features/wishlist/service";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const shared = await wishlistService.getSharedWishlist(token);

  if (!shared) {
    return NextResponse.json({ error: "Wishlist not found" }, { status: 404 });
  }

  return NextResponse.json(shared);
}
