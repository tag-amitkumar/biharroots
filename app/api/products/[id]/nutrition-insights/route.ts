import { NextResponse } from "next/server";
import * as productService from "@/features/products/service";
import { splitNutritionSpecs, parseIngredientsList } from "@/features/nutrition/service";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const product = await productService.getProduct(id);

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const { nutrition } = splitNutritionSpecs(product.specifications);
  const ingredients = parseIngredientsList(product.ingredients);

  return NextResponse.json({ nutrition, ingredients });
}
