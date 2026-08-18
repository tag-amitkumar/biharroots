"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Award,
  ChevronDown,
  Coins,
  Heart,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Search,
  Settings,
  ShoppingBag,
  Sparkles,
  User,
} from "lucide-react";
import { useCartStore } from "@/features/cart/store";
import { useCartDrawerStore } from "@/features/cart/drawerStore";
import { useWalletStore } from "@/features/wallet/store";
import SearchBar from "@/features/products/components/SearchBar";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ThemeToggle from "@/components/theme-toggle";
import SafeImage from "@/components/SafeImage";
import { cn } from "@/lib/utils";

type NavCategory = {
  id: string;
  name: string;
  slug: string;
  icon: string;
  banner: string;
  showInNav: boolean;
};

export default function Navbar() {
  const router = useRouter();
  const { data: session } = useSession();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [categories, setCategories] = useState<NavCategory[]>([]);
  const [scrolled, setScrolled] = useState(false);

  const cart = useCartStore((state) => state.cart);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const toggleCartDrawer = useCartDrawerStore((state) => state.toggle);

  const coinBalance = useWalletStore((state) => state.balance);
  const setCoinBalance = useWalletStore((state) => state.setBalance);

  const [membershipTier, setMembershipTier] = useState<{ name: string; badgeColor: string } | null>(
    null
  );

  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data: NavCategory[]) =>
        setCategories(Array.isArray(data) ? data.filter((c) => c.showInNav) : [])
      )
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    if (!session) return;

    fetch("/api/wallet")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => data && setCoinBalance(data.balance))
      .catch(() => {});

    fetch("/api/membership")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => data?.tier && setMembershipTier(data.tier))
      .catch(() => {});
  }, [session, setCoinBalance]);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 8);
    }

    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b transition-all duration-300",
        scrolled
          ? "border-neutral-200/70 bg-white/80 shadow-sm backdrop-blur-xl dark:border-neutral-800/70 dark:bg-neutral-950/80"
          : "border-transparent bg-white/60 backdrop-blur-xl dark:bg-neutral-950/60"
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center gap-6 px-6 py-4">
        <Link href="/" className="group shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🌿</span>
            <div>
              <h1 className="font-display text-xl font-extrabold tracking-tight text-neutral-900 transition-colors group-hover:text-brand-600 dark:text-white sm:text-2xl">
                NatureCart
              </h1>
              <p className="hidden text-[11px] font-medium uppercase tracking-widest text-neutral-400 sm:block">
                Fresh &middot; Organic &middot; Premium
              </p>
            </div>
          </div>
        </Link>

        <nav className="ml-4 hidden items-center gap-1 lg:flex">
          <div
            className="relative"
            onMouseEnter={() => setMegaOpen(true)}
            onMouseLeave={() => setMegaOpen(false)}
          >
            <button className="flex items-center gap-1 rounded-full px-4 py-2 text-sm font-semibold text-neutral-700 transition-colors hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800">
              Shop
              <ChevronDown className="h-3.5 w-3.5" />
            </button>

            <AnimatePresence>
              {megaOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.18 }}
                  className="absolute left-0 top-full pt-3"
                >
                  <div className="max-h-[70vh] w-[560px] overflow-y-auto rounded-3xl border border-neutral-200/70 bg-white/95 p-6 shadow-2xl backdrop-blur-xl dark:border-neutral-800 dark:bg-neutral-900/95">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-neutral-400">
                      Shop by category
                    </p>

                    <div className="grid grid-cols-2 gap-1">
                      {categories.length === 0 && (
                        <p className="col-span-2 py-4 text-sm text-neutral-400">
                          No categories yet.
                        </p>
                      )}

                      {categories.map((category) => (
                        <Link
                          key={category.id}
                          href={`/category/${category.slug}`}
                          onClick={() => setMegaOpen(false)}
                          className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-brand-50 hover:text-brand-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
                        >
                          <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-lg">
                            <SafeImage
                              src={category.banner}
                              alt=""
                              fill
                              sizes="32px"
                              className="object-cover"
                              kind="category"
                            />
                          </div>
                          <span>{category.icon || "🌿"}</span>
                          {category.name}
                        </Link>
                      ))}
                    </div>

                    <div className="mt-3 flex gap-2">
                      <Link
                        href="/categories"
                        onClick={() => setMegaOpen(false)}
                        className="flex-1 rounded-2xl border border-neutral-200 px-4 py-3 text-center text-sm font-semibold text-neutral-700 transition-colors hover:border-brand-300 hover:text-brand-700 dark:border-neutral-700 dark:text-neutral-200"
                      >
                        All Categories
                      </Link>

                      <Link
                        href="/shop"
                        onClick={() => setMegaOpen(false)}
                        className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-600 to-brand-700 px-4 py-3 text-sm font-semibold text-white"
                      >
                        View all products
                        <Sparkles className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Link
            href="/wishlist"
            className="rounded-full px-4 py-2 text-sm font-semibold text-neutral-700 transition-colors hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800"
          >
            Wishlist
          </Link>

          <Link
            href="/compare"
            className="rounded-full px-4 py-2 text-sm font-semibold text-neutral-700 transition-colors hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800"
          >
            Compare
          </Link>
        </nav>

        <div className="ml-auto hidden flex-1 lg:flex lg:max-w-[380px]">
          <SearchBar />
        </div>

        <div className="ml-auto flex items-center gap-1 lg:ml-0">
          <button
            onClick={() => setSearchOpen((v) => !v)}
            aria-label="Search"
            className="rounded-full p-2.5 text-neutral-700 transition-colors hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800 lg:hidden"
          >
            <Search className="h-5 w-5" />
          </button>

          <div className="hidden sm:block">
            <ThemeToggle />
          </div>

          {session && coinBalance !== null && (
            <Link
              href="/account/wallet"
              className="hidden items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-sm font-semibold text-amber-700 transition-colors hover:bg-amber-100 dark:border-amber-900/40 dark:bg-amber-900/10 dark:text-amber-400 sm:flex"
            >
              <Coins className="h-4 w-4" />
              {coinBalance}
            </Link>
          )}

          {session ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  aria-label="Account menu"
                  className="rounded-full p-2.5 text-neutral-700 transition-colors hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800"
                >
                  <User className="h-5 w-5" />
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="normal-case tracking-normal text-neutral-700 dark:text-neutral-200">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate">{session.user?.name || session.user?.email}</span>
                    {membershipTier && (
                      <span
                        className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white"
                        style={{ backgroundColor: membershipTier.badgeColor }}
                      >
                        {membershipTier.name}
                      </span>
                    )}
                  </div>
                </DropdownMenuLabel>

                <DropdownMenuSeparator />

                <DropdownMenuItem onClick={() => router.push("/account/profile")}>
                  <User className="h-4 w-4" /> My Account
                </DropdownMenuItem>

                <DropdownMenuItem onClick={() => router.push("/account/orders")}>
                  <Package className="h-4 w-4" /> Orders
                </DropdownMenuItem>

                <DropdownMenuItem onClick={() => router.push("/wishlist")}>
                  <Heart className="h-4 w-4" /> Wishlist
                </DropdownMenuItem>

                <DropdownMenuItem onClick={() => router.push("/account/wallet")}>
                  <Coins className="h-4 w-4" /> NatureCoin Wallet
                </DropdownMenuItem>

                <DropdownMenuItem onClick={() => router.push("/account/membership")}>
                  <Award className="h-4 w-4" /> NatureClub
                </DropdownMenuItem>

                <DropdownMenuItem onClick={() => router.push("/account/settings")}>
                  <Settings className="h-4 w-4" /> Settings
                </DropdownMenuItem>

                {session.user?.role === "admin" && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => router.push("/admin/dashboard")}>
                      <LayoutDashboard className="h-4 w-4" /> Admin Dashboard
                    </DropdownMenuItem>
                  </>
                )}

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="text-red-600 focus:bg-red-50 dark:text-red-400 dark:focus:bg-red-950/40"
                >
                  <LogOut className="h-4 w-4" /> Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">Login</Link>
              </Button>
              <Button variant="primary" size="sm" asChild>
                <Link href="/signup">Sign Up</Link>
              </Button>
            </div>
          )}

          <button
            onClick={toggleCartDrawer}
            aria-label="Open cart"
            className="relative rounded-full p-2.5 text-neutral-700 transition-colors hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800"
          >
            <ShoppingBag className="h-5 w-5" />

            {totalItems > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-[10px] font-bold text-white">
                {totalItems}
              </span>
            )}
          </button>

          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            className="rounded-full p-2.5 text-neutral-700 transition-colors hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800 lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-neutral-200/70 px-6 dark:border-neutral-800 lg:hidden"
          >
            <div className="py-3">
              <SearchBar />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="right" className="flex flex-col">
          <SheetHeader>
            <SheetTitle>Menu</SheetTitle>
          </SheetHeader>

          <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-4">
            <Link
              href="/shop"
              onClick={() => setMobileOpen(false)}
              className="rounded-2xl px-4 py-3 text-sm font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              Shop
            </Link>

            <Link
              href="/categories"
              onClick={() => setMobileOpen(false)}
              className="rounded-2xl px-4 py-3 text-sm font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              All Categories
            </Link>

            <Link
              href="/wishlist"
              onClick={() => setMobileOpen(false)}
              className="rounded-2xl px-4 py-3 text-sm font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              Wishlist
            </Link>

            <Link
              href="/compare"
              onClick={() => setMobileOpen(false)}
              className="rounded-2xl px-4 py-3 text-sm font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              Compare
            </Link>

            <Link
              href="/cart"
              onClick={() => setMobileOpen(false)}
              className="rounded-2xl px-4 py-3 text-sm font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              Cart
            </Link>

            {categories.length > 0 && (
              <>
                <p className="mt-3 px-4 text-xs font-semibold uppercase tracking-wide text-neutral-400">
                  Categories
                </p>

                {categories.map((category) => (
                  <Link
                    key={category.id}
                    href={`/category/${category.slug}`}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
                  >
                    <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-lg">
                      <SafeImage
                        src={category.banner}
                        alt=""
                        fill
                        sizes="32px"
                        className="object-cover"
                        kind="category"
                      />
                    </div>
                    <span>{category.icon || "🌿"}</span>
                    {category.name}
                  </Link>
                ))}
              </>
            )}

            <div className="my-2 border-t border-neutral-200 dark:border-neutral-800" />

            {session ? (
              <>
                <Link
                  href="/account/profile"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-2xl px-4 py-3 text-sm font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  My Account
                </Link>

                <Link
                  href="/account/wallet"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  <span className="flex items-center gap-2">
                    <Coins className="h-4 w-4" /> NatureCoin Wallet
                  </span>
                  {coinBalance !== null && (
                    <span className="text-amber-600 dark:text-amber-400">{coinBalance}</span>
                  )}
                </Link>

                <Link
                  href="/account/membership"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  <span className="flex items-center gap-2">
                    <Award className="h-4 w-4" /> NatureClub
                  </span>
                  {membershipTier && (
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase text-white"
                      style={{ backgroundColor: membershipTier.badgeColor }}
                    >
                      {membershipTier.name}
                    </span>
                  )}
                </Link>

                <button
                  onClick={() => {
                    setMobileOpen(false);
                    signOut({ callbackUrl: "/" });
                  }}
                  className="rounded-2xl px-4 py-3 text-left text-sm font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-2xl px-4 py-3 text-sm font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  Login
                </Link>

                <Link
                  href="/signup"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-2xl px-4 py-3 text-sm font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  Signup
                </Link>
              </>
            )}

            {session?.user?.role === "admin" && (
              <>
                <div className="my-2 border-t border-neutral-200 dark:border-neutral-800" />

                <p className="px-4 text-xs font-semibold uppercase tracking-wide text-neutral-400">
                  Admin
                </p>

                <Link
                  href="/admin/dashboard"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-2xl px-4 py-3 text-sm font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  Dashboard
                </Link>

                <Link
                  href="/admin/products/list"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-2xl px-4 py-3 text-sm font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  Products
                </Link>
              </>
            )}
          </nav>
        </SheetContent>
      </Sheet>
    </header>
  );
}
