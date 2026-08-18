import { NextResponse } from "next/server";
import { getAdminSession } from "@/features/auth/service";
import * as supportService from "@/features/support/service";

export async function GET() {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const tickets = await supportService.listTickets();

  return NextResponse.json(tickets);
}
