import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/features/auth/auth-options";
import * as recentlyViewedService from "@/features/recently-viewed/service";
import { RecentlyViewedValidationError } from "@/features/recently-viewed/errors";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json([]);
  }

  const excludeId = new URL(req.url).searchParams.get("excludeId") || undefined;
  const products = await recentlyViewedService.getRecentlyViewed(session.user.id, excludeId);

  return NextResponse.json(products);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ success: true });
  }

  try {
    const body = await req.json();
    await recentlyViewedService.recordView(session.user.id, body.productId);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof RecentlyViewedValidationError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    console.error(error);

    return NextResponse.json({ success: false }, { status: 500 });
  }
}
