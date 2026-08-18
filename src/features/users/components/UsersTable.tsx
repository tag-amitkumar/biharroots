"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import UserRoleSelect from "./UserRoleSelect";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
};

export default function UsersTable({ users }: { users: User[] }) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  const filtered = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        !search ||
        user.name.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase());

      const matchesRole = !roleFilter || user.role === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [users, search, roleFilter]);

  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-200/70 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex flex-wrap items-center gap-3 border-b border-neutral-200/70 p-4 dark:border-neutral-800">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder="Search by name or email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {["", "user", "admin"].map((role) => (
            <button
              key={role || "all"}
              onClick={() => setRoleFilter(role)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-semibold capitalize transition-colors",
                roleFilter === role
                  ? "border-brand-600 bg-brand-600 text-white"
                  : "border-neutral-200 text-neutral-600 dark:border-neutral-700 dark:text-neutral-300"
              )}
            >
              {role || "All"}
            </button>
          ))}
        </div>

        <p className="ml-auto text-sm text-neutral-400">
          {filtered.length} of {users.length} users
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-neutral-50 dark:bg-neutral-800/50">
            <tr>
              <th className="p-4 text-left text-sm font-semibold text-neutral-500">Name</th>
              <th className="p-4 text-left text-sm font-semibold text-neutral-500">Email</th>
              <th className="p-4 text-left text-sm font-semibold text-neutral-500">Role</th>
              <th className="p-4 text-left text-sm font-semibold text-neutral-500">Joined</th>
            </tr>
          </thead>

          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-neutral-400">
                  No users match your search.
                </td>
              </tr>
            ) : (
              filtered.map((user) => (
                <tr key={user.id} className="border-b border-neutral-100 dark:border-neutral-800">
                  <td className="p-4 text-neutral-900 dark:text-white">{user.name}</td>
                  <td className="p-4 text-neutral-600 dark:text-neutral-300">{user.email}</td>
                  <td className="p-4">
                    <UserRoleSelect userId={user.id} role={user.role} />
                  </td>
                  <td className="p-4 text-neutral-500">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
