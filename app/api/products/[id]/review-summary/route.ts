import { NextResponse } from "next/server";
import * as reviewService from "@/features/reviews/service";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const summary = await reviewService.getReviewSummary(id);

  return NextResponse.json(summary);
}
