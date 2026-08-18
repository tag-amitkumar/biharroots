"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

const MAX_ITEMS = 8;

interface RecentlyViewedStore {
  productIds: string[];
  addViewed: (id: string) => void;
}

export const useRecentlyViewedStore = create<RecentlyViewedStore>()(
  persist(
    (set) => ({
      productIds: [],

      addViewed: (id) =>
        set((state) => ({
          productIds: [
            id,
            ...state.productIds.filter((existing) => existing !== id),
          ].slice(0, MAX_ITEMS),
        })),
    }),
    {
      name: "recently-viewed-storage",
    }
  )
);
