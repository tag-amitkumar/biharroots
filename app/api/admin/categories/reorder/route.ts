import { NextResponse } from "next/server";
import { getAdminSession } from "@/features/auth/service";
import * as categoryService from "@/features/categories/service";

export async function POST(req: Request) {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const orderedIds: string[] = Array.isArray(body.orderedIds) ? body.orderedIds : [];

  if (orderedIds.length === 0) {
    return NextResponse.json({ success: false, error: "orderedIds is required" }, { status: 400 });
  }

  await categoryService.reorderCategories(orderedIds);

  return NextResponse.json({ success: true });
}
