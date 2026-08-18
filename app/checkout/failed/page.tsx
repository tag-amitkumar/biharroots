"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { ShoppingBag, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

function FailedContent() {
  const searchParams = useSearchParams();
  const reason = searchParams.get("reason");

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="max-w-lg rounded-[32px] border border-neutral-200/70 bg-white p-12 text-center shadow-xl dark:border-neutral-800 dark:bg-neutral-900"
    >
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-50 dark:bg-red-900/20">
        <XCircle className="h-10 w-10 text-red-500" />
      </div>

      <h1 className="mt-6 font-display text-4xl font-extrabold text-neutral-900 dark:text-white">
        Order Could Not Be Placed
      </h1>

      <p className="mt-4 text-neutral-500 dark:text-neutral-400">
        {reason || "Something went wrong while placing your order."}
      </p>

      <p className="mt-2 text-sm text-neutral-400">
        Your cart has been kept as-is — nothing was charged. Please check
        your details and try again.
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Button variant="primary" asChild>
          <Link href="/checkout">Back to Checkout</Link>
        </Button>

        <Button variant="outline" asChild>
          <Link href="/">
            <ShoppingBag className="h-4 w-4" /> Continue Shopping
          </Link>
        </Button>
      </div>
    </motion.div>
  );
}

export default function CheckoutFailedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-6 dark:bg-canvas-dark">
      <Suspense fallback={null}>
        <FailedContent />
      </Suspense>
    </div>
  );
}
