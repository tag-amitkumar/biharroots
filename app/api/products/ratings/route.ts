import { NextResponse } from "next/server";
import * as reviewService from "@/features/reviews/service";

export async function GET() {
  const ratings = await reviewService.getRatingSummaries();

  return NextResponse.json(ratings);
}
