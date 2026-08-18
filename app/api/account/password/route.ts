import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/features/auth/auth-options";
import * as userService from "@/features/users/service";
import { UserValidationError } from "@/features/users/errors";

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  try {
    await userService.changePassword(
      session.user.id,
      body.currentPassword,
      body.newPassword
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof UserValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    throw error;
  }
}
