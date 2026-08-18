import { NextResponse } from "next/server";
import { getAdminSession } from "@/features/auth/service";
import * as categoryService from "@/features/categories/service";
import { CategoryValidationError } from "@/features/categories/errors";

export async function GET() {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const categories = await categoryService.getAllCategoriesFlat();

  return NextResponse.json(categories);
}

export async function POST(req: Request) {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const category = await categoryService.createCategory(body);

    return NextResponse.json({ success: true, category });
  } catch (error) {
    if (error instanceof CategoryValidationError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    console.error(error);

    return NextResponse.json({ success: false }, { status: 500 });
  }
}
