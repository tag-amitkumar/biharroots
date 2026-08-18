"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Copy, Tag } from "lucide-react";
import { toast } from "sonner";
import { fadeInUp, staggerContainer, viewportOnce } from "@/lib/motion";

type Coupon = {
  code: string;
  type: string;
  value: number;
  minOrderAmount: number;
  expiresAt: string | null;
};

function describeCoupon(coupon: Coupon) {
  const discount =
    coupon.type === "percent" ? `${coupon.value}% OFF` : `₹${coupon.value} OFF`;

  return coupon.minOrderAmount > 0
    ? `${discount} orders above ₹${coupon.minOrderAmount}`
    : `${discount} your order`;
}

function copyCode(code: string) {
  navigator.clipboard
    .writeText(code)
    .then(() => toast.success(`Copied "${code}" to clipboard`))
    .catch(() => toast.error("Could not copy code"));
}

export default function OfferBanner() {
  const [coupons, setCoupons] = useState<Coupon[] | null>(null);

  useEffect(() => {
    fetch("/api/coupons/active")
      .then((res) => res.json())
      .then(setCoupons)
      .catch(() => setCoupons([]));
  }, []);

  if (coupons !== null && coupons.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-6 py-10">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
        variants={fadeInUp}
        className="overflow-hidden rounded-[40px] bg-gradient-to-r from-brand-600 via-brand-600 to-brand-700 p-10 text-white sm:p-14"
      >
        <p className="text-sm font-semibold uppercase tracking-widest text-white/80">
          Seasonal Offers
        </p>
        <h2 className="mt-3 font-display text-4xl font-extrabold sm:text-5xl">
          Deals worth grabbing
        </h2>

        {coupons === null ? (
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-2xl bg-white/10" />
            ))}
          </div>
        ) : (
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            variants={staggerContainer}
            className="mt-8 grid gap-4 sm:grid-cols-3"
          >
            {coupons.map((coupon) => (
              <motion.button
                key={coupon.code}
                variants={fadeInUp}
                onClick={() => copyCode(coupon.code)}
                className="group flex flex-col items-start gap-2 rounded-2xl border border-white/20 bg-white/10 p-5 text-left backdrop-blur transition hover:bg-white/20"
              >
                <span className="flex items-center gap-2 font-mono text-lg font-bold">
                  <Tag className="h-4 w-4" /> {coupon.code}
                  <Copy className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
                </span>
                <span className="text-sm text-white/80">{describeCoupon(coupon)}</span>
              </motion.button>
            ))}
          </motion.div>
        )}

        <Link
          href="/shop"
          className="mt-8 inline-block rounded-2xl bg-white px-8 py-4 font-semibold text-brand-700 transition hover:bg-neutral-100"
        >
          Shop the Sale
        </Link>
      </motion.div>
    </section>
  );
}
