import { NextResponse } from "next/server";
import * as productService from "@/features/products/service";

export async function GET() {
  const categories = await productService.listCategories();

  return NextResponse.json(categories);
}
