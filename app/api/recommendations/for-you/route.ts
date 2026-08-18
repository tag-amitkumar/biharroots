import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/features/auth/auth-options";
import * as recommendationsService from "@/features/recommendations/service";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json([]);
  }

  const products = await recommendationsService.getRecommendedForYou(session.user.id);

  return NextResponse.json(products ?? []);
}
