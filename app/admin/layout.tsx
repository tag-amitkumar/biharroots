"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import AdminSidebar from "@/features/admin/components/AdminSidebar";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <aside className="hidden w-64 shrink-0 bg-neutral-900 p-6 lg:block">
        <AdminSidebar />
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-neutral-200 bg-white px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900 lg:hidden">
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Open admin menu"
            className="rounded-full p-2 text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="font-display font-bold text-neutral-900 dark:text-white">
            NatureCart Admin
          </span>
        </header>

        <main className="flex-1">{children}</main>
      </div>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="bg-neutral-900 p-6 text-white">
          <SheetHeader className="sr-only">
            <SheetTitle>Admin Menu</SheetTitle>
          </SheetHeader>
          <AdminSidebar onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  );
}
