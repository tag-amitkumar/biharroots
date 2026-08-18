"use client";

import { motion } from "framer-motion";
import { Leaf, ShieldCheck, Truck, Sprout } from "lucide-react";
import { fadeInUp, staggerContainer, viewportOnce } from "@/lib/motion";

const PILLARS = [
  {
    icon: Sprout,
    title: "100% Organic",
    description: "Fresh organic products sourced directly from trusted farms.",
  },
  {
    icon: Truck,
    title: "Fast Delivery",
    description: "Same-day delivery in selected locations, every time.",
  },
  {
    icon: ShieldCheck,
    title: "Secure Payments",
    description: "Cash on delivery with a fully protected checkout flow.",
  },
  {
    icon: Leaf,
    title: "Farm Fresh Quality",
    description: "Hand-picked, premium quality groceries you can trust.",
  },
];

export default function BrandStory() {
  return (
    <section className="bg-white py-20 dark:bg-neutral-950">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            variants={fadeInUp}
          >
            <p className="text-sm font-semibold uppercase tracking-widest text-brand-600">
              Our Story
            </p>
            <h2 className="mt-2 font-display text-4xl font-extrabold text-neutral-900 dark:text-white sm:text-5xl">
              Why Choose NatureCart
            </h2>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-neutral-600 dark:text-neutral-300">
              We started NatureCart with a simple idea: everyday groceries
              shouldn&apos;t come at the cost of quality or the planet. Every
              product on our shelves is sourced from farms we trust, handled
              with care, and delivered fresh &mdash; so healthy living is
              always within reach.
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            variants={staggerContainer}
            className="grid gap-5 sm:grid-cols-2"
          >
            {PILLARS.map((pillar) => (
              <motion.div
                key={pillar.title}
                variants={fadeInUp}
                className="rounded-3xl bg-brand-50 p-7 dark:bg-neutral-900"
              >
                <pillar.icon className="h-8 w-8 text-brand-600" />
                <h3 className="mt-4 text-lg font-bold text-neutral-900 dark:text-white">
                  {pillar.title}
                </h3>
                <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                  {pillar.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
