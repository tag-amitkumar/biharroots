"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { useSession } from "next-auth/react";

type WishlistContextValue = {
  productIds: Set<string>;
  toggle: (productId: string) => Promise<void>;
};

const WishlistContext = createContext<WishlistContextValue>({
  productIds: new Set(),
  toggle: async () => {},
});

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { status } = useSession();

  const [productIds, setProductIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (status !== "authenticated") {
      Promise.resolve().then(() => setProductIds(new Set()));
      return;
    }

    fetch("/api/wishlist")
      .then((res) => (res.ok ? res.json() : []))
      .then((items: { productId: string }[]) =>
        setProductIds(new Set(items.map((item) => item.productId)))
      )
      .catch(() => setProductIds(new Set()));
  }, [status]);

  async function toggle(productId: string) {
    const wasWishlisted = productIds.has(productId);

    setProductIds((prev) => {
      const next = new Set(prev);

      if (wasWishlisted) {
        next.delete(productId);
      } else {
        next.add(productId);
      }

      return next;
    });

    if (wasWishlisted) {
      await fetch(`/api/wishlist?productId=${productId}`, {
        method: "DELETE",
      });
    } else {
      await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
    }
  }

  return (
    <WishlistContext.Provider value={{ productIds, toggle }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  return useContext(WishlistContext);
}
