import { NextResponse } from "next/server";
import { getAdminSession } from "@/features/auth/service";
import * as supportService from "@/features/support/service";
import { SupportValidationError } from "@/features/support/errors";

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
    const ticket = await supportService.setTicketStatus(id, body.status);

    return NextResponse.json({ success: true, ticket });
  } catch (error) {
    if (error instanceof SupportValidationError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    console.error(error);

    return NextResponse.json({ success: false }, { status: 500 });
  }
}
