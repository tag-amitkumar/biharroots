import * as userService from "@/features/users/service";
import UsersTable from "@/features/users/components/UsersTable";

// Live user data on every request — see app/admin/dashboard/page.tsx
// for why this can't be statically prerendered.
export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const users = await userService.listUsers();

  return (
    <div className="p-8">
      <p className="text-sm font-semibold uppercase tracking-widest text-brand-600">
        People
      </p>
      <h1 className="mb-8 mt-2 font-display text-4xl font-extrabold text-neutral-900 dark:text-white">
        Users
      </h1>

      <UsersTable
        users={users.map((user) => ({
          ...user,
          createdAt: user.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
