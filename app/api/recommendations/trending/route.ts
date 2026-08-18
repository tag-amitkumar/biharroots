import { NextResponse } from "next/server";
import * as recommendationsService from "@/features/recommendations/service";

export async function GET() {
  const products = await recommendationsService.getTrendingProducts();

  return NextResponse.json(products);
}
