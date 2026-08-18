"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Award,
  Coins,
  FolderTree,
  Gift,
  LayoutDashboard,
  Leaf,
  LifeBuoy,
  Package,
  ShoppingCart,
  Tag,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products/list", label: "Products", icon: Package },
  { href: "/admin/categories", label: "Categories", icon: FolderTree },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/coupons", label: "Coupons", icon: Tag },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/loyalty", label: "NatureCoin & Loyalty", icon: Coins },
  { href: "/admin/membership", label: "NatureClub Tiers", icon: Award },
  { href: "/admin/referrals", label: "Referrals", icon: Gift },
  { href: "/admin/support", label: "Support Requests", icon: LifeBuoy },
];

export default function AdminSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-2 pb-8">
        <Leaf className="h-6 w-6 text-brand-400" />
        <span className="font-display text-lg font-extrabold text-white">
          NatureCart Admin
        </span>
      </div>

      <nav className="flex-1 space-y-1">
        {LINKS.map((link) => {
          const isActive = pathname.startsWith(link.href);

          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-colors",
                isActive
                  ? "bg-white text-neutral-900"
                  : "text-neutral-300 hover:bg-white/10 hover:text-white"
              )}
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
