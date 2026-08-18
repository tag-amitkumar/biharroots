import { NextResponse } from "next/server";
import * as recommendationsService from "@/features/recommendations/service";

export async function GET() {
  const seasonal = await recommendationsService.getSeasonalRecommendations();

  return NextResponse.json(seasonal);
}
