import { NextResponse } from "next/server";
import { getAdminSession } from "@/features/auth/service";
import * as categoryService from "@/features/categories/service";

export async function GET() {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const analytics = await categoryService.getCategoryAnalytics();

  return NextResponse.json(analytics);
}
