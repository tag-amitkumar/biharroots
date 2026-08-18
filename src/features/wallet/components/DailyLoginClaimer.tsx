"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { useWalletStore } from "@/features/wallet/store";

// Mounted once globally. Renders nothing - it just silently claims the
// once-per-day login bonus (and the once-per-year birthday bonus) for a
// signed-in customer whenever the app loads, and keeps the shared wallet
// balance in sync for the navbar/dashboard to read.
export default function DailyLoginClaimer() {
  const { status } = useSession();
  const setBalance = useWalletStore((state) => state.setBalance);

  useEffect(() => {
    if (status !== "authenticated") return;

    fetch("/api/wallet/daily-login", { method: "POST" })
      .then((res) => res.json())
      .then((data) => {
        setBalance(data.balance);

        if (data.dailyAwarded > 0) {
          toast.success(`+${data.dailyAwarded} NatureCoins for stopping by today!`);
        }

        if (data.birthdayAwarded > 0) {
          toast.success(`+${data.birthdayAwarded} NatureCoins — happy birthday from NatureCart!`);
        }
      })
      .catch(() => {});
  }, [status, setBalance]);

  return null;
}
