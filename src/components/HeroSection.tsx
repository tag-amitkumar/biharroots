"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ShieldCheck, Sparkles, Truck } from "lucide-react";

const MotionImage = motion(Image);

const SLIDES = [
  {
    badge: "Free delivery above ₹500",
    title: "Fresh &",
    highlight: "Organic Grocery",
    description:
      "Farm fresh vegetables, fruits, dairy and healthy products delivered directly to your home.",
    image:
      "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1600",
  },
  {
    badge: "Up to 30% off",
    title: "Seasonal",
    highlight: "Fruit Sale",
    description:
      "Hand-picked seasonal fruits at unbeatable prices, while stocks last.",
    image:
      "https://images.unsplash.com/photo-1610832958506-aa56368176cf?q=80&w=1600",
  },
  {
    badge: "100% certified organic",
    title: "Healthy Living",
    highlight: "Starts Here",
    description:
      "Every product is sourced from trusted organic farms across the country.",
    image:
      "https://images.unsplash.com/photo-1540420773420-3366772f4999?q=80&w=1600",
  },
];

export default function HeroSection() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % SLIDES.length);
    }, 5500);

    return () => clearInterval(timer);
  }, []);

  const slide = SLIDES[index];

  return (
    <section className="relative flex min-h-[92vh] items-center overflow-hidden bg-neutral-950">
      <AnimatePresence mode="popLayout">
        <MotionImage
          key={slide.image}
          src={slide.image}
          alt={slide.highlight}
          fill
          priority
          sizes="100vw"
          initial={{ opacity: 0, scale: 1.08 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="object-cover"
        />
      </AnimatePresence>

      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/20" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

      <div className="relative mx-auto w-full max-w-7xl px-6 py-24">
        <div className="max-w-2xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -24 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur">
                <Sparkles className="h-4 w-4" />
                {slide.badge}
              </span>

              <h1 className="mt-8 font-display text-6xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-7xl lg:text-8xl">
                {slide.title}
                <span className="block bg-gradient-to-r from-brand-400 to-brand-200 bg-clip-text text-transparent">
                  {slide.highlight}
                </span>
              </h1>

              <p className="mt-6 max-w-lg text-lg text-neutral-200 sm:text-xl">
                {slide.description}
              </p>
            </motion.div>
          </AnimatePresence>

          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/shop"
              className="group inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 font-bold text-neutral-900 transition hover:bg-neutral-100"
            >
              Shop Now
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>

            <Link
              href="#categories"
              className="rounded-full border border-white/30 px-8 py-4 font-bold text-white backdrop-blur transition hover:bg-white/10"
            >
              Explore Categories
            </Link>
          </div>

          <div className="mt-12 flex flex-wrap gap-8 text-sm font-medium text-neutral-300">
            <span className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-brand-400" /> 100% Organic
            </span>
            <span className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-brand-400" /> Fast Delivery
            </span>
            <span className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-brand-400" /> Secure Checkout
            </span>
          </div>

          <div className="mt-10 flex gap-2">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={`h-1.5 rounded-full transition-all ${
                  i === index ? "w-10 bg-white" : "w-4 bg-white/30"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
