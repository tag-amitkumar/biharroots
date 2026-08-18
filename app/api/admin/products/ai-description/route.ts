import { NextResponse } from "next/server";
import { getAdminSession } from "@/features/auth/service";
import { generateProductAIContent } from "@/features/products/aiDescription";
import { AIProviderNotConfiguredError } from "@/features/ai/errors";

export async function POST(req: Request) {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();

  if (!body?.name || typeof body.name !== "string") {
    return NextResponse.json({ error: "Product name is required" }, { status: 400 });
  }

  try {
    const content = await generateProductAIContent(body);

    return NextResponse.json(content);
  } catch (error) {
    if (error instanceof AIProviderNotConfiguredError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }

    return NextResponse.json(
      { error: "AI generation failed. Please try again." },
      { status: 502 }
    );
  }
}
