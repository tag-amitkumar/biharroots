"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

type Product = {
id: string;
name: string;
price: number;
image: string;
variantId?: string;
variantLabel?: string;
};

interface CartItem extends Product {
quantity: number;
}

function sameLine(a: Product, b: Product) {
  return a.id === b.id && a.variantId === b.variantId;
}

function matchesLine(item: CartItem, id: string, variantId?: string) {
  return item.id === id && item.variantId === variantId;
}

interface CartStore {
cart: CartItem[];
savedForLater: CartItem[];

addToCart: (product: Product) => void;
removeFromCart: (id: string, variantId?: string) => void;
increaseQuantity: (id: string, variantId?: string) => void;
decreaseQuantity: (id: string, variantId?: string) => void;
clearCart: () => void;
saveForLater: (id: string, variantId?: string) => void;
moveToCart: (id: string, variantId?: string) => void;
removeSavedForLater: (id: string, variantId?: string) => void;
}

export const useCartStore = create<CartStore>()(
persist(
(set) => ({
cart: [],
savedForLater: [],

  addToCart: (product) =>
    set((state) => {
      const existing = state.cart.find((item) => sameLine(item, product));

      if (existing) {
        return {
          cart: state.cart.map((item) =>
            sameLine(item, product)
              ? {
                  ...item,
                  quantity: item.quantity + 1,
                }
              : item
          ),
        };
      }

      return {
        cart: [
          ...state.cart,
          {
            ...product,
            quantity: 1,
          },
        ],
      };
    }),

  removeFromCart: (id, variantId) =>
    set((state) => ({
      cart: state.cart.filter(
        (item) => !(item.id === id && item.variantId === variantId)
      ),
    })),

  increaseQuantity: (id, variantId) =>
    set((state) => ({
      cart: state.cart.map((item) =>
        item.id === id && item.variantId === variantId
          ? {
              ...item,
              quantity: item.quantity + 1,
            }
          : item
      ),
    })),

  decreaseQuantity: (id, variantId) =>
    set((state) => ({
      cart: state.cart
        .map((item) =>
          item.id === id && item.variantId === variantId
            ? {
                ...item,
                quantity: item.quantity - 1,
              }
            : item
        )
        .filter((item) => item.quantity > 0),
    })),

  clearCart: () =>
    set({
      cart: [],
    }),

  saveForLater: (id, variantId) =>
    set((state) => {
      const item = state.cart.find((line) => matchesLine(line, id, variantId));

      if (!item) return state;

      return {
        cart: state.cart.filter((line) => !matchesLine(line, id, variantId)),
        savedForLater: [
          ...state.savedForLater.filter((line) => !matchesLine(line, id, variantId)),
          item,
        ],
      };
    }),

  moveToCart: (id, variantId) =>
    set((state) => {
      const item = state.savedForLater.find((line) => matchesLine(line, id, variantId));

      if (!item) return state;

      const existing = state.cart.find((line) => matchesLine(line, id, variantId));

      return {
        savedForLater: state.savedForLater.filter((line) => !matchesLine(line, id, variantId)),
        cart: existing
          ? state.cart.map((line) =>
              matchesLine(line, id, variantId)
                ? { ...line, quantity: line.quantity + item.quantity }
                : line
            )
          : [...state.cart, item],
      };
    }),

  removeSavedForLater: (id, variantId) =>
    set((state) => ({
      savedForLater: state.savedForLater.filter((line) => !matchesLine(line, id, variantId)),
    })),
}),
{
  name: "naturecart-storage",
}

)
);
