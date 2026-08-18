import { NextResponse } from "next/server";
import { getAdminSession } from "@/features/auth/service";
import * as productService from "@/features/products/service";
import { parseProductFilterParams } from "@/features/products/filtering";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const idsParam = searchParams.get("ids");

  if (idsParam) {
    const ids = idsParam.split(",").filter(Boolean);
    const products = await productService.getProductsByIds(ids);
    return NextResponse.json(products);
  }

  const products = await productService.listProducts(parseProductFilterParams(searchParams));

  return NextResponse.json(products);
}

export async function POST(req: Request) {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();

  const product = await productService.createProduct(body);

  return NextResponse.json(product);
}
