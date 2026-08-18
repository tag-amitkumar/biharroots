"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Scale } from "lucide-react";
import { useCompareStore } from "@/features/products/compareStore";

export default function CompareBar() {
  const productIds = useCompareStore((state) => state.productIds);
  const clear = useCompareStore((state) => state.clear);

  return (
    <AnimatePresence>
      {productIds.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-24 left-1/2 z-40 flex -translate-x-1/2 items-center gap-4 rounded-full bg-neutral-900 px-6 py-3 text-white shadow-2xl"
        >
          <span className="flex items-center gap-2 text-sm font-semibold">
            <Scale className="h-4 w-4" />
            {productIds.length} selected to compare
          </span>

          <Link
            href="/compare"
            className="rounded-full bg-white px-4 py-2 text-sm font-bold text-neutral-900"
          >
            Compare Now
          </Link>

          <button
            onClick={clear}
            className="text-sm text-neutral-400 hover:text-white"
          >
            Clear
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
