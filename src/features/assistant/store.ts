"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  products?: { id: string; name: string; price: number; image: string; description: string }[];
};

interface AssistantStore {
  isOpen: boolean;
  messages: ChatMessage[];
  open: () => void;
  close: () => void;
  toggle: () => void;
  addMessage: (message: ChatMessage) => void;
  clear: () => void;
}

// Persisted (unlike the cart drawer's open/close-only store) so the
// conversation survives navigating between pages within the same
// shopping session, per "contextual conversations across the shopping
// session" - it deliberately does not persist `isOpen`, so the widget
// doesn't pop open unexpectedly on a fresh visit.
export const useAssistantStore = create<AssistantStore>()(
  persist(
    (set) => ({
      isOpen: false,
      messages: [],

      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      toggle: () => set((state) => ({ isOpen: !state.isOpen })),

      addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),

      clear: () => set({ messages: [] }),
    }),
    {
      name: "assistant-chat-storage",
      partialize: (state) => ({ messages: state.messages }),
    }
  )
);
