"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Mail } from "lucide-react";
import { toast } from "sonner";
import { fadeInUp, viewportOnce } from "@/lib/motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function Newsletter() {
  const [email, setEmail] = useState("");

  function subscribe(e: React.FormEvent) {
    e.preventDefault();

    if (!email.trim()) {
      toast.error("Please enter your email");
      return;
    }

    toast.success("Thanks for subscribing!");
    setEmail("");
  }

  return (
    <section className="mx-auto max-w-7xl px-6 py-20">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
        variants={fadeInUp}
        className="relative overflow-hidden rounded-[40px] bg-neutral-950 p-12 text-center sm:p-16"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-brand-600/20 via-transparent to-brand-700/20" />

        <div className="relative mx-auto max-w-xl">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
            <Mail className="h-6 w-6 text-brand-400" />
          </div>

          <h2 className="mt-6 font-display text-4xl font-extrabold text-white">
            Subscribe for Healthy Living
          </h2>

          <p className="mt-3 text-neutral-400">
            Fresh drops, seasonal offers, and organic living tips - straight
            to your inbox.
          </p>

          <form
            onSubmit={subscribe}
            className="mt-8 flex flex-col gap-3 sm:flex-row"
          >
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              className="flex-1 border-white/20 bg-white/10 text-white placeholder:text-neutral-400"
            />

            <Button type="submit" size="lg" variant="primary">
              Subscribe
            </Button>
          </form>
        </div>
      </motion.div>
    </section>
  );
}
