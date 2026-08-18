"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { WishlistProvider } from "@/features/wishlist/WishlistProvider";
import DailyLoginClaimer from "@/features/wallet/components/DailyLoginClaimer";

export default function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <SessionProvider>
        <WishlistProvider>
          <DailyLoginClaimer />
          {children}
        </WishlistProvider>
      </SessionProvider>
    </ThemeProvider>
  );
}
