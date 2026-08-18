import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/features/auth/auth-options";
import * as orderService from "@/features/orders/service";
import { OrderValidationError } from "@/features/orders/errors";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || !session?.user?.email) {
    return NextResponse.json(
      { error: "You must be logged in to view your orders" },
      { status: 401 }
    );
  }

  const orders = await orderService.getOrdersForUser(
    session.user.id,
    session.user.email
  );

  return NextResponse.json(orders);
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json();

    const order = await orderService.placeOrder({
      ...body,
      userId: session?.user?.id,
    });

    return NextResponse.json({
      success: true,
      order,
    });
  } catch (error) {
    if (error instanceof OrderValidationError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    console.error(error);

    return NextResponse.json(
      { success: false },
      { status: 500 }
    );
  }
}
