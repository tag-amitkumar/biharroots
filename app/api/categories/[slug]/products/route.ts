import { NextResponse } from "next/server";
import * as categoryService from "@/features/categories/service";
import { parseProductFilterParams } from "@/features/products/filtering";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const { searchParams } = new URL(req.url);

  const result = await categoryService.getProductsForCategorySlug(
    slug,
    parseProductFilterParams(searchParams)
  );

  if (!result) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  return NextResponse.json(result.products);
}
