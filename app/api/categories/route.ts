import { NextResponse } from "next/server";
import * as categoryService from "@/features/categories/service";

export async function GET() {
  const categories = await categoryService.getCategoryTree();

  return NextResponse.json(categories);
}
