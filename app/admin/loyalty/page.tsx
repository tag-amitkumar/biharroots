"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Coins, Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

type LoyaltyConfig = {
  coinsPerRupee: number;
  redemptionValue: number;
  minRedemptionCoins: number;
  reviewBonus: number;
  dailyLoginBonus: number;
  birthdayBonus: number;
  referralReferrerBonus: number;
  referralReferredBonus: number;
  coinExpiryDays: number | null;
};

const FIELDS: { key: keyof LoyaltyConfig; label: string; hint: string; step?: string }[] = [
  { key: "coinsPerRupee", label: "Coins earned per ₹1 spent", hint: "e.g. 0.1 = 1 coin per ₹10", step: "0.01" },
  { key: "redemptionValue", label: "₹ value per coin redeemed", hint: "e.g. 0.5 = 2 coins = ₹1", step: "0.01" },
  { key: "minRedemptionCoins", label: "Minimum coins to redeem", hint: "Smallest redemption allowed at checkout" },
  { key: "reviewBonus", label: "Coins for writing a review", hint: "Awarded once per submitted review" },
  { key: "dailyLoginBonus", label: "Daily login bonus", hint: "Awarded once per calendar day" },
  { key: "birthdayBonus", label: "Birthday bonus", hint: "Awarded once per year, on the customer's birthday" },
  { key: "referralReferrerBonus", label: "Referral bonus (referrer)", hint: "Paid to the person who shared their code" },
  { key: "referralReferredBonus", label: "Referral bonus (new customer)", hint: "Paid to the person who used a referral code" },
];

export default function AdminLoyaltyPage() {
  const [config, setConfig] = useState<LoyaltyConfig | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/loyalty")
      .then((res) => res.json())
      .then((data) => setConfig(data.config))
      .catch(() => setConfig(null));
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!config) return;

    setSaving(true);

    try {
      const res = await fetch("/api/admin/loyalty", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Loyalty settings updated");
      } else {
        toast.error(data.error || "Could not update settings");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (!config) {
    return (
      <div className="p-8">
        <div className="h-96 animate-pulse rounded-2xl bg-neutral-200 dark:bg-neutral-800" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <p className="text-sm font-semibold uppercase tracking-widest text-brand-600">
        Loyalty
      </p>
      <h1 className="mb-8 mt-2 flex items-center gap-2 font-display text-4xl font-extrabold text-neutral-900 dark:text-white">
        <Coins className="h-8 w-8 text-amber-500" /> NatureCoin Settings
      </h1>

      <form
        onSubmit={save}
        className="grid max-w-3xl gap-4 rounded-2xl border border-neutral-200/70 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 sm:grid-cols-2"
      >
        {FIELDS.map((field) => (
          <div key={field.key}>
            <Label htmlFor={field.key}>{field.label}</Label>
            <Input
              id={field.key}
              type="number"
              min={0}
              step={field.step || "1"}
              value={config[field.key] ?? ""}
              onChange={(e) =>
                setConfig({ ...config, [field.key]: Number(e.target.value) })
              }
              className="mt-1.5"
            />
            <p className="mt-1 text-xs text-neutral-400">{field.hint}</p>
          </div>
        ))}

        <Button type="submit" variant="primary" disabled={saving} className="sm:col-span-2">
          <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save Settings"}
        </Button>
      </form>
    </div>
  );
}
