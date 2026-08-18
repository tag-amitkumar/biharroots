import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/features/auth/auth-options";
import * as savedCartService from "@/features/savedCarts/service";
import { SavedCartValidationError } from "@/features/savedCarts/errors";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const savedCarts = await savedCartService.listSavedCarts(session.user.id);

  return NextResponse.json(
    savedCarts.map((cart) => ({
      ...cart,
      items: JSON.parse(cart.items),
    }))
  );
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  try {
    const savedCart = await savedCartService.saveCart(
      session.user.id,
      body.name,
      body.items
    );

    return NextResponse.json(savedCart);
  } catch (error) {
    if (error instanceof SavedCartValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    throw error;
  }
}
