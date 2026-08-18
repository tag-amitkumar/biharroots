"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function ProfilePage() {
  const { data: session, update } = useSession();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (session?.user) {
      Promise.resolve().then(() => {
        setName(session.user.name || "");
        setPhone(session.user.phone || "");
      });
    }
  }, [session]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch("/api/account/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone }),
      });

      if (!res.ok) {
        toast.error("Could not update profile");
        return;
      }

      toast.success("Profile updated");
      await update({ name, phone });
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-3xl border border-neutral-200/70 bg-white p-8 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <div className="mb-8 flex items-center gap-4">
        <Avatar className="h-16 w-16">
          <AvatarFallback className="bg-brand-50 text-brand-600 dark:bg-brand-900/20">
            {name ? name.charAt(0).toUpperCase() : <User className="h-6 w-6" />}
          </AvatarFallback>
        </Avatar>

        <div>
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">Profile</h2>
          <p className="text-sm text-neutral-500">Manage your personal details</p>
        </div>
      </div>

      <form onSubmit={save} className="max-w-md space-y-4">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1.5"
          />
        </div>

        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            value={session?.user?.email || ""}
            disabled
            className="mt-1.5"
          />
        </div>

        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="mt-1.5"
          />
        </div>

        <Button type="submit" variant="primary" disabled={saving}>
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </form>
    </div>
  );
}
