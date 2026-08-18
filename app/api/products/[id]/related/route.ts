import { NextResponse } from "next/server";
import * as productService from "@/features/products/service";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const products = await productService.getRelatedProducts(id);

  return NextResponse.json(products);
}
