"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle2, Package, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";

function SuccessContent() {
  const searchParams = useSearchParams();

  const orderId = searchParams.get("orderId");
  const amount = searchParams.get("amount");

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="max-w-lg rounded-[32px] border border-neutral-200/70 bg-white p-12 text-center shadow-xl dark:border-neutral-800 dark:bg-neutral-900"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.15, type: "spring", stiffness: 200, damping: 14 }}
        className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-brand-50 dark:bg-brand-900/20"
      >
        <CheckCircle2 className="h-10 w-10 text-brand-600" />
      </motion.div>

      <h1 className="mt-6 font-display text-4xl font-extrabold text-neutral-900 dark:text-white">
        Order Successful
      </h1>

      <p className="mt-4 text-neutral-500 dark:text-neutral-400">
        Thank you for shopping with NatureCart. We&apos;ll send updates to
        your email as your order is prepared and shipped.
      </p>

      {orderId && (
        <div className="mt-6 rounded-2xl bg-neutral-50 p-6 text-left dark:bg-neutral-800/50">
          <div className="flex justify-between text-sm">
            <span className="text-neutral-500">Order Number</span>
            <span className="font-mono font-semibold text-neutral-900 dark:text-white">{orderId}</span>
          </div>

          {amount && (
            <div className="mt-2 flex justify-between text-sm">
              <span className="text-neutral-500">Amount Paid</span>
              <span className="font-semibold text-neutral-900 dark:text-white">₹{amount}</span>
            </div>
          )}

          <div className="mt-2 flex justify-between text-sm">
            <span className="text-neutral-500">Payment Method</span>
            <span className="flex items-center gap-1.5 font-semibold text-neutral-900 dark:text-white">
              <Truck className="h-3.5 w-3.5" /> Cash on Delivery
            </span>
          </div>
        </div>
      )}

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        {orderId && (
          <Button variant="outline" asChild>
            <Link href={`/account/orders/${orderId}`}>
              <Package className="h-4 w-4" /> Track Order
            </Link>
          </Button>
        )}

        <Button variant="primary" asChild>
          <Link href="/">Continue Shopping</Link>
        </Button>
      </div>
    </motion.div>
  );
}

export default function SuccessPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-6 dark:bg-canvas-dark">
      <Suspense fallback={null}>
        <SuccessContent />
      </Suspense>
    </div>
  );
}
