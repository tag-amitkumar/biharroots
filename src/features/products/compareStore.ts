"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export const MAX_COMPARE = 4;

interface CompareStore {
  productIds: string[];
  toggle: (id: string) => void;
  clear: () => void;
}

export const useCompareStore = create<CompareStore>()(
  persist(
    (set, get) => ({
      productIds: [],

      toggle: (id) => {
        const { productIds } = get();

        set({
          productIds: productIds.includes(id)
            ? productIds.filter((existing) => existing !== id)
            : [...productIds, id],
        });
      },

      clear: () => set({ productIds: [] }),
    }),
    {
      name: "compare-storage",
    }
  )
);
