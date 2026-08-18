import { NextResponse } from "next/server";
import * as reviewService from "@/features/reviews/service";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limit = Number(searchParams.get("limit")) || 6;

  const reviews = await reviewService.getFeaturedReviews(limit);

  return NextResponse.json(reviews);
}
