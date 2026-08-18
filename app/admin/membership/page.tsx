"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Award, Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Tier = {
  id: string;
  name: string;
  minSpend: number;
  coinMultiplier: number;
  discountPercent: number;
  freeShipping: boolean;
  earlyAccess: boolean;
  birthdayBonus: number;
  badgeColor: string;
  sortOrder: number;
};

export default function AdminMembershipPage() {
  const [tiers, setTiers] = useState<Tier[] | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/loyalty")
      .then((res) => res.json())
      .then((data) => setTiers(data.tiers))
      .catch(() => setTiers([]));
  }, []);

  function updateLocalTier(id: string, patch: Partial<Tier>) {
    setTiers((prev) => prev && prev.map((tier) => (tier.id === id ? { ...tier, ...patch } : tier)));
  }

  async function saveTier(tier: Tier) {
    setSavingId(tier.id);

    try {
      const res = await fetch(`/api/admin/loyalty/tiers/${tier.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          minSpend: tier.minSpend,
          coinMultiplier: tier.coinMultiplier,
          discountPercent: tier.discountPercent,
          freeShipping: tier.freeShipping,
          earlyAccess: tier.earlyAccess,
          birthdayBonus: tier.birthdayBonus,
          badgeColor: tier.badgeColor,
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success(`${tier.name} tier updated`);
      } else {
        toast.error(data.error || "Could not update tier");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSavingId(null);
    }
  }

  if (!tiers) {
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
        <Award className="h-8 w-8 text-brand-600" /> NatureClub Tiers
      </h1>

      <div className="grid gap-6 lg:grid-cols-2">
        {[...tiers].sort((a, b) => a.sortOrder - b.sortOrder).map((tier) => (
          <div
            key={tier.id}
            className="rounded-3xl border border-neutral-200/70 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
          >
            <div className="mb-4 flex items-center justify-between">
              <Badge
                className="text-sm"
                style={{ backgroundColor: tier.badgeColor, color: "white", borderColor: "transparent" }}
              >
                {tier.name}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor={`${tier.id}-minSpend`}>Min. lifetime spend (₹)</Label>
                <Input
                  id={`${tier.id}-minSpend`}
                  type="number"
                  min={0}
                  value={tier.minSpend}
                  onChange={(e) => updateLocalTier(tier.id, { minSpend: Number(e.target.value) })}
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor={`${tier.id}-multiplier`}>Coin multiplier</Label>
                <Input
                  id={`${tier.id}-multiplier`}
                  type="number"
                  min={0.1}
                  step="0.1"
                  value={tier.coinMultiplier}
                  onChange={(e) => updateLocalTier(tier.id, { coinMultiplier: Number(e.target.value) })}
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor={`${tier.id}-discount`}>Discount (%)</Label>
                <Input
                  id={`${tier.id}-discount`}
                  type="number"
                  min={0}
                  max={100}
                  value={tier.discountPercent}
                  onChange={(e) => updateLocalTier(tier.id, { discountPercent: Number(e.target.value) })}
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor={`${tier.id}-birthday`}>Birthday bonus (coins)</Label>
                <Input
                  id={`${tier.id}-birthday`}
                  type="number"
                  min={0}
                  value={tier.birthdayBonus}
                  onChange={(e) => updateLocalTier(tier.id, { birthdayBonus: Number(e.target.value) })}
                  className="mt-1.5"
                />
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-300">
                <input
                  type="checkbox"
                  checked={tier.freeShipping}
                  onChange={(e) => updateLocalTier(tier.id, { freeShipping: e.target.checked })}
                />
                Free shipping
              </label>

              <label className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-300">
                <input
                  type="checkbox"
                  checked={tier.earlyAccess}
                  onChange={(e) => updateLocalTier(tier.id, { earlyAccess: e.target.checked })}
                />
                Early access to offers
              </label>
            </div>

            <Button
              variant="primary"
              size="sm"
              className="mt-4 w-full"
              disabled={savingId === tier.id}
              onClick={() => saveTier(tier)}
            >
              <Save className="h-4 w-4" />
              {savingId === tier.id ? "Saving..." : "Save Tier"}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
