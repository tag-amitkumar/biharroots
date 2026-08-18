import { NextResponse } from "next/server";
import * as assistantService from "@/features/assistant/service";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const message: string = body.message || "";
    const history = Array.isArray(body.history) ? body.history : [];

    if (!message.trim()) {
      return NextResponse.json({ error: "message is required" }, { status: 400 });
    }

    const result = await assistantService.getAssistantReply(message, history);

    return NextResponse.json(result);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "The assistant ran into a problem. Please try again." },
      { status: 500 }
    );
  }
}
