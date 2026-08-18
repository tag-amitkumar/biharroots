"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Leaf, Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

function InstagramIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} {...props}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function TwitterIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M18.9 3H21l-6.6 7.55L22.2 21h-6.1l-4.8-6.3L5.8 21H3.6l7.06-8.08L2 3h6.25l4.34 5.75L18.9 3Zm-1.07 16.1h1.16L7.24 4.83H6l11.83 14.27Z" />
    </svg>
  );
}

function FacebookIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M13.5 21v-7.6h2.55l.38-2.96h-2.93V8.53c0-.86.24-1.44 1.47-1.44h1.57V4.46c-.27-.04-1.2-.12-2.28-.12-2.26 0-3.8 1.38-3.8 3.9v2.18H8v2.96h2.46V21h3.04Z" />
    </svg>
  );
}

export default function Footer() {
  const [email, setEmail] = useState("");

  function subscribe(e: React.FormEvent) {
    e.preventDefault();

    if (!email.trim()) return;

    toast.success("Subscribed! Welcome to the NatureCart family.");
    setEmail("");
  }

  return (
    <footer className="border-t border-neutral-200/70 bg-white dark:border-neutral-800 dark:bg-neutral-950">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          <div>
            <div className="flex items-center gap-2">
              <Leaf className="h-6 w-6 text-brand-600" />
              <h2 className="font-display text-2xl font-extrabold text-neutral-900 dark:text-white">
                NatureCart
              </h2>
            </div>

            <p className="mt-4 max-w-xs text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
              Premium organic groceries, sourced responsibly and delivered
              fresh. Elevating everyday essentials since day one.
            </p>

            <div className="mt-6 flex items-center gap-3">
              <a
                href="#"
                aria-label="Instagram"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 text-neutral-500 transition-colors hover:border-brand-600 hover:text-brand-600 dark:border-neutral-800 dark:text-neutral-400"
              >
                <InstagramIcon className="h-4 w-4" />
              </a>
              <a
                href="#"
                aria-label="Twitter"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 text-neutral-500 transition-colors hover:border-brand-600 hover:text-brand-600 dark:border-neutral-800 dark:text-neutral-400"
              >
                <TwitterIcon className="h-4 w-4" />
              </a>
              <a
                href="#"
                aria-label="Facebook"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 text-neutral-500 transition-colors hover:border-brand-600 hover:text-brand-600 dark:border-neutral-800 dark:text-neutral-400"
              >
                <FacebookIcon className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-neutral-400">
              Shop
            </h3>

            <ul className="space-y-3 text-sm text-neutral-600 dark:text-neutral-300">
              <li><Link href="/shop" className="transition-colors hover:text-brand-600">All Products</Link></li>
              <li><Link href="/wishlist" className="transition-colors hover:text-brand-600">Wishlist</Link></li>
              <li><Link href="/compare" className="transition-colors hover:text-brand-600">Compare</Link></li>
              <li><Link href="/cart" className="transition-colors hover:text-brand-600">Cart</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-neutral-400">
              Account
            </h3>

            <ul className="space-y-3 text-sm text-neutral-600 dark:text-neutral-300">
              <li><Link href="/account/profile" className="transition-colors hover:text-brand-600">My Account</Link></li>
              <li><Link href="/account/orders" className="transition-colors hover:text-brand-600">Orders</Link></li>
              <li><Link href="/account/addresses" className="transition-colors hover:text-brand-600">Addresses</Link></li>
              <li><Link href="/login" className="transition-colors hover:text-brand-600">Login</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-neutral-400">
              Stay in the loop
            </h3>

            <p className="mb-4 text-sm text-neutral-500 dark:text-neutral-400">
              Fresh drops, seasonal offers, and organic living tips.
            </p>

            <form onSubmit={subscribe} className="flex gap-2">
              <Input
                type="email"
                required
                placeholder="you@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11"
              />

              <Button type="submit" size="icon" variant="primary" aria-label="Subscribe">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-neutral-200/70 pt-8 text-sm text-neutral-500 dark:border-neutral-800 dark:text-neutral-400 sm:flex-row">
          <p>&copy; {new Date().getFullYear()} NatureCart. All rights reserved.</p>
          <p>Cash on Delivery &middot; Secure Checkout &middot; Fresh Guarantee</p>
        </div>
      </div>
    </footer>
  );
}
