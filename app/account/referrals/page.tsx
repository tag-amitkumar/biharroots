"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Check, Copy, Gift, Share2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ReferralEntry = {
  id: string;
  referrerReward: number | null;
  referredReward: number | null;
  status: string;
  createdAt: string;
  referred: { name: string; email: string } | null;
};

export default function ReferralsPage() {
  const [code, setCode] = useState<string | null>(null);
  const [history, setHistory] = useState<ReferralEntry[] | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/referrals")
      .then((res) => res.json())
      .then((data) => {
        setCode(data.code);
        setHistory(data.history);
      })
      .catch(() => setHistory([]));
  }, []);

  const referralLink =
    code && typeof window !== "undefined" ? `${window.location.origin}/signup?ref=${code}` : "";

  function copyLink() {
    navigator.clipboard
      .writeText(referralLink)
      .then(() => {
        setCopied(true);
        toast.success("Referral link copied!");
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => toast.error("Could not copy link"));
  }

  async function shareLink() {
    const nav = navigator as Navigator & {
      share?: (data: { title: string; text: string; url: string }) => Promise<void>;
    };

    if (nav.share) {
      try {
        await nav.share({
          title: "Join NatureCart",
          text: "Shop premium organic groceries with NatureCart — use my referral code for a welcome bonus!",
          url: referralLink,
        });
      } catch {
        // User dismissed the share sheet — not an error.
      }
      return;
    }

    copyLink();
  }

  const totalEarned = history?.reduce((sum, r) => sum + (r.referrerReward ?? 0), 0) ?? 0;

  return (
    <div className="space-y-8">
      <div className="rounded-3xl bg-gradient-to-br from-brand-600 to-brand-700 p-8 text-white shadow-lg">
        <div className="flex items-center gap-2">
          <Gift className="h-5 w-5" />
          <p className="text-sm font-semibold uppercase tracking-wide">Refer &amp; Earn</p>
        </div>

        <p className="mt-4 max-w-md text-white/90">
          Share your code with friends. When they sign up, you both get NatureCoins.
        </p>

        {code && (
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Input
              readOnly
              value={referralLink}
              className="flex-1 border-white/30 bg-white/10 text-white"
            />

            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={copyLink} className="border-white/40 text-white hover:bg-white/10">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>

              <Button type="button" onClick={shareLink} className="bg-white text-brand-700 hover:bg-neutral-100">
                <Share2 className="h-4 w-4" /> Share
              </Button>
            </div>
          </div>
        )}

        <p className="mt-4 font-mono text-lg font-bold tracking-widest">{code}</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="rounded-3xl border border-neutral-200/70 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-900/20">
            <Users className="h-5 w-5" />
          </div>
          <p className="mt-4 text-2xl font-bold text-neutral-900 dark:text-white">
            {history?.length ?? 0}
          </p>
          <p className="text-sm text-neutral-500">Friends Referred</p>
        </div>

        <div className="rounded-3xl border border-neutral-200/70 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-900/20">
            <Gift className="h-5 w-5" />
          </div>
          <p className="mt-4 text-2xl font-bold text-neutral-900 dark:text-white">{totalEarned}</p>
          <p className="text-sm text-neutral-500">NatureCoins Earned from Referrals</p>
        </div>
      </div>

      <div className="rounded-3xl border border-neutral-200/70 bg-white p-8 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="mb-6 text-2xl font-bold text-neutral-900 dark:text-white">
          Referral History
        </h2>

        {!history || history.length === 0 ? (
          <div className="py-10 text-center">
            <Users className="mx-auto h-10 w-10 text-neutral-300" />
            <p className="mt-3 text-neutral-500">
              No referrals yet — share your link above to start earning!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between rounded-2xl border border-neutral-200/70 p-4 dark:border-neutral-800"
              >
                <div>
                  <p className="font-semibold text-neutral-900 dark:text-white">
                    {entry.referred?.name ?? "A new customer"}
                  </p>
                  <p className="text-xs text-neutral-400">
                    Joined {new Date(entry.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <span className="font-bold text-brand-600">+{entry.referrerReward} coins</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
