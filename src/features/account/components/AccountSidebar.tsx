"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Award,
  Bell,
  Coins,
  Gift,
  Heart,
  LayoutDashboard,
  MapPin,
  Package,
  Settings,
  ShoppingBag,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/account", label: "Dashboard", icon: LayoutDashboard },
  { href: "/account/profile", label: "Profile", icon: User },
  { href: "/account/addresses", label: "Addresses", icon: MapPin },
  { href: "/account/orders", label: "Orders", icon: Package },
  { href: "/wishlist", label: "Wishlist", icon: Heart },
  { href: "/account/wallet", label: "NatureCoin Wallet", icon: Coins },
  { href: "/account/membership", label: "NatureClub", icon: Award },
  { href: "/account/referrals", label: "Referrals", icon: Gift },
  { href: "/account/saved-carts", label: "Saved Carts", icon: ShoppingBag },
  { href: "/account/notifications", label: "Notifications", icon: Bell },
  { href: "/account/settings", label: "Settings", icon: Settings },
];

export default function AccountSidebar() {
  const pathname = usePathname();

  return (
    <aside className="h-fit space-y-1 rounded-3xl border border-neutral-200/70 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      {LINKS.map((link) => {
        const isActive =
          link.href === "/account"
            ? pathname === "/account"
            : pathname.startsWith(link.href);

        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-colors",
              isActive
                ? "bg-brand-600 text-white"
                : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
            )}
          >
            <link.icon className="h-4 w-4" />
            {link.label}
          </Link>
        );
      })}
    </aside>
  );
}
