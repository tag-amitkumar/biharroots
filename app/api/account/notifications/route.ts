import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/features/auth/auth-options";
import * as notificationService from "@/features/notifications/service";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const notifications = await notificationService.getNotificationsForUser(
    session.user.id
  );

  return NextResponse.json(notifications);
}

export async function PUT() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await notificationService.markAllAsRead(session.user.id);

  return NextResponse.json({ success: true });
}
