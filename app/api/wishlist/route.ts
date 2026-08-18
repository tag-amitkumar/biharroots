import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/features/auth/auth-options";
import * as wishlistService from "@/features/wishlist/service";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "You must be logged in to view your wishlist" },
      { status: 401 }
    );
  }

  const items = await wishlistService.getWishlistForUser(session.user.id);

  return NextResponse.json(items);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "You must be logged in to use the wishlist" },
      { status: 401 }
    );
  }

  const body = await req.json();

  if (!body.productId) {
    return NextResponse.json(
      { error: "productId is required" },
      { status: 400 }
    );
  }

  const item = await wishlistService.addToWishlist(
    session.user.id,
    body.productId
  );

  return NextResponse.json(item);
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "You must be logged in to use the wishlist" },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(req.url);
  const productId = searchParams.get("productId");

  if (!productId) {
    return NextResponse.json(
      { error: "productId is required" },
      { status: 400 }
    );
  }

  await wishlistService.removeFromWishlist(session.user.id, productId);

  return NextResponse.json({ success: true });
}
