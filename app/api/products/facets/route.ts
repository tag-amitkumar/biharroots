import { NextResponse } from "next/server";
import * as productService from "@/features/products/service";

export async function GET() {
  const [brands, countries] = await Promise.all([
    productService.listBrands(),
    productService.listCountriesOfOrigin(),
  ]);

  return NextResponse.json({ brands, countries });
}
