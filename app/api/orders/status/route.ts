import { NextResponse } from "next/server";
import { getAdminSession } from "@/features/auth/service";
import * as orderService from "@/features/orders/service";

export async function PUT(req: Request) {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();

  const order = await orderService.setOrderStatus(body.id, body.status);

  return NextResponse.json(order);
}
