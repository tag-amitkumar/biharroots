import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/features/auth/auth-options";
import * as supportService from "@/features/support/service";
import { SupportValidationError } from "@/features/support/errors";

// Open to guests too - a shopper doesn't need an account to ask for help.
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  try {
    const body = await req.json();

    const ticket = await supportService.createTicket({
      userId: session?.user?.id,
      name: body.name || session?.user?.name || "",
      email: body.email || session?.user?.email || "",
      message: body.message,
    });

    return NextResponse.json({ success: true, ticket });
  } catch (error) {
    if (error instanceof SupportValidationError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    console.error(error);

    return NextResponse.json({ success: false }, { status: 500 });
  }
}
