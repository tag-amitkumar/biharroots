import { NextResponse } from "next/server";
import { getAIProvider } from "@/features/ai/provider";

export async function GET() {
  const provider = getAIProvider();

  return NextResponse.json({
    configured: provider !== null,
    provider: provider?.name ?? null,
  });
}
