import { getServerSession } from "next-auth";
import { authOptions } from "@/features/auth/auth-options";

export async function getAdminSession() {
  const session = await getServerSession(authOptions);

  if (session?.user?.role !== "admin") {
    return null;
  }

  return session;
}
