import { NextResponse } from "next/server";
import { getAdminSession } from "@/features/auth/service";
import * as userService from "@/features/users/service";
import { UserValidationError } from "@/features/users/errors";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const body = await req.json();

  try {
    const user = await userService.updateUserRole(id, body.role);

    return NextResponse.json(user);
  } catch (error) {
    if (error instanceof UserValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    throw error;
  }
}
