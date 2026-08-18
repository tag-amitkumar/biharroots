import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/features/auth/auth-options";
import AccountSidebar from "@/features/account/components/AccountSidebar";

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <p className="text-sm font-semibold uppercase tracking-widest text-brand-600">
        Welcome back
      </p>
      <h1 className="mt-2 font-display text-4xl font-extrabold text-neutral-900 dark:text-white">
        {session.user?.name || "My Account"}
      </h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-[240px_1fr]">
        <AccountSidebar />

        <main>{children}</main>
      </div>
    </div>
  );
}
