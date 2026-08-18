"use client";

import { create } from "zustand";

interface WalletStore {
  balance: number | null;
  setBalance: (balance: number) => void;
}

export const useWalletStore = create<WalletStore>((set) => ({
  balance: null,
  setBalance: (balance) => set({ balance }),
}));
