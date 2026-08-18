"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

const MAX_SEARCHES = 5;

interface RecentSearchesStore {
  searches: string[];
  addSearch: (term: string) => void;
  clear: () => void;
}

export const useRecentSearchesStore = create<RecentSearchesStore>()(
  persist(
    (set) => ({
      searches: [],

      addSearch: (term) =>
        set((state) => ({
          searches: [
            term,
            ...state.searches.filter(
              (existing) => existing.toLowerCase() !== term.toLowerCase()
            ),
          ].slice(0, MAX_SEARCHES),
        })),

      clear: () => set({ searches: [] }),
    }),
    {
      name: "recent-searches-storage",
    }
  )
);
