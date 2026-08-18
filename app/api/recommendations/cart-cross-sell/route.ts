import { NextResponse } from "next/server";
import * as recommendationsService from "@/features/recommendations/service";

export async function GET(req: Request) {
  const idsParam = new URL(req.url).searchParams.get("ids") || "";
  const productIds = idsParam.split(",").map((id) => id.trim()).filter(Boolean);

  if (productIds.length === 0) {
    return NextResponse.json([]);
  }

  const products = await recommendationsService.getCartCrossSell(productIds);

  return NextResponse.json(products);
}
