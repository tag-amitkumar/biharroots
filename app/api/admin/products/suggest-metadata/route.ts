import { NextResponse } from "next/server";
import { getAdminSession } from "@/features/auth/service";
import * as categoryService from "@/features/categories/service";
import {
  generateSeoKeywords,
  generateProductTags,
  generateImageAltText,
  suggestCategories,
} from "@/features/products/adminTools";

export async function POST(req: Request) {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();

  if (!body?.name || typeof body.name !== "string") {
    return NextResponse.json({ error: "Product name is required" }, { status: 400 });
  }

  const [keywordsResult, tagsResult, altTextResult, categories] = await Promise.all([
    generateSeoKeywords(body),
    generateProductTags(body),
    generateImageAltText(body),
    categoryService.getAllCategoriesFlat(),
  ]);

  const categorySuggestions = suggestCategories(body, categories);

  return NextResponse.json({
    seoKeywords: keywordsResult,
    tags: tagsResult,
    altText: altTextResult,
    categorySuggestions,
  });
}
