import { NextResponse } from "next/server";
import { getAdminSession } from "@/features/auth/service";
import * as categoryService from "@/features/categories/service";
import { CategoryValidationError } from "@/features/categories/errors";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const category = await categoryService.updateCategory(id, body);

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

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  await categoryService.deleteCategory(id);

  return NextResponse.json({ success: true });
}
