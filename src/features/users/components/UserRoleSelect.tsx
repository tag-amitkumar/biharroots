"use client";

import { useState } from "react";

export default function UserRoleSelect({
  userId,
  role,
}: {
  userId: string;
  role: string;
}) {
  const [current, setCurrent] = useState(role);
  const [saving, setSaving] = useState(false);

  async function updateRole(newRole: string) {
    setSaving(true);

    const res = await fetch(`/api/users/${userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });

    if (res.ok) {
      setCurrent(newRole);
    }

    setSaving(false);
  }

  return (
    <select
      value={current}
      disabled={saving}
      onChange={(e) => updateRole(e.target.value)}
      className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-sm text-neutral-900 outline-none focus:border-brand-500 disabled:opacity-60 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-50"
    >
      <option value="user">user</option>
      <option value="admin">admin</option>
    </select>
  );
}
