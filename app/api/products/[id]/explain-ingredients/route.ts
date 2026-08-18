import { NextResponse } from "next/server";
import * as productService from "@/features/products/service";
import { parseIngredientsList, explainIngredients } from "@/features/nutrition/service";
import { AIProviderNotConfiguredError } from "@/features/ai/errors";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const product = await productService.getProduct(id);

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const ingredients = parseIngredientsList(product.ingredients);

  if (ingredients.length === 0) {
    return NextResponse.json({ error: "This product has no ingredients listed yet" }, { status: 400 });
  }

  try {
    const explanations = await explainIngredients(ingredients);

    return NextResponse.json({ explanations });
  } catch (error) {
    if (error instanceof AIProviderNotConfiguredError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }

    return NextResponse.json({ error: "Could not generate an explanation. Please try again." }, { status: 502 });
  }
}
