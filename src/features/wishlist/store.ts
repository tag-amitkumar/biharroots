"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface WishlistStore {
  items: string[];

  toggleWishlist: (id: string) => void;
}

export const useWishlistStore =
  create<WishlistStore>()(
    persist(
      (set) => ({
        items: [],

        toggleWishlist: (id) =>
          set((state) => ({
            items: state.items.includes(id)
              ? state.items.filter(
                  (item) => item !== id
                )
              : [...state.items, id],
          })),
      }),
      {
        name: "wishlist-storage",
      }
    )
  );
