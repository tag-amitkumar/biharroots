"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Tag } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Coupon = {
  id: string;
  code: string;
  type: string;
  value: number;
  active: boolean;
  minOrderAmount: number;
  expiresAt: string | null;
  maxRedemptions: number | null;
  perUserLimit: number | null;
  createdAt: string;
  _count?: { redemptions: number };
};

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [code, setCode] = useState("");
  const [type, setType] = useState<"percent" | "fixed">("percent");
  const [value, setValue] = useState("");
  const [minOrderAmount, setMinOrderAmount] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [maxRedemptions, setMaxRedemptions] = useState("");
  const [perUserLimit, setPerUserLimit] = useState("");

  function loadCoupons() {
    fetch("/api/admin/coupons")
      .then((res) => res.json())
      .then((data) => {
        setCoupons(data);
        setLoading(false);
      });
  }

  useEffect(() => {
    loadCoupons();
  }, []);

  async function createCoupon(e: React.FormEvent) {
    e.preventDefault();

    setSaving(true);

    try {
      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          type,
          value: Number(value),
          minOrderAmount: Number(minOrderAmount) || 0,
          expiresAt: expiresAt || null,
          maxRedemptions: maxRedemptions ? Number(maxRedemptions) : null,
          perUserLimit: perUserLimit ? Number(perUserLimit) : null,
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Coupon created");
        setCode("");
        setValue("");
        setMinOrderAmount("");
        setExpiresAt("");
        setMaxRedemptions("");
        setPerUserLimit("");
        loadCoupons();
      } else {
        toast.error(data.error || "Could not create coupon");
      }
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(coupon: Coupon) {
    await fetch(`/api/admin/coupons/${coupon.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !coupon.active }),
    });

    loadCoupons();
  }

  async function removeCoupon(id: string) {
    if (!confirm("Delete this coupon?")) return;

    await fetch(`/api/admin/coupons/${id}`, { method: "DELETE" });
    loadCoupons();
  }

  return (
    <div className="p-8">
      <p className="text-sm font-semibold uppercase tracking-widest text-brand-600">
        Promotions
      </p>
      <h1 className="mb-8 mt-2 font-display text-4xl font-extrabold text-neutral-900 dark:text-white">
        Coupons
      </h1>

      <form
        onSubmit={createCoupon}
        className="mb-8 grid gap-4 rounded-2xl border border-neutral-200/70 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 md:grid-cols-5"
      >
        <Input
          required
          placeholder="CODE"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="uppercase"
        />

        <select
          value={type}
          onChange={(e) => setType(e.target.value as "percent" | "fixed")}
          className="rounded-2xl border border-neutral-200 bg-white px-4 text-sm text-neutral-900 outline-none focus:border-brand-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-50"
        >
          <option value="percent">Percent off</option>
          <option value="fixed">Fixed amount off</option>
        </select>

        <Input
          required
          type="number"
          min={1}
          placeholder={type === "percent" ? "% off" : "₹ off"}
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />

        <Input
          type="number"
          min={0}
          placeholder="Min order ₹ (optional)"
          value={minOrderAmount}
          onChange={(e) => setMinOrderAmount(e.target.value)}
        />

        <Input
          type="date"
          value={expiresAt}
          onChange={(e) => setExpiresAt(e.target.value)}
        />

        <Input
          type="number"
          min={1}
          placeholder="Max total uses (optional)"
          value={maxRedemptions}
          onChange={(e) => setMaxRedemptions(e.target.value)}
        />

        <Input
          type="number"
          min={1}
          placeholder="Max uses per customer (optional)"
          value={perUserLimit}
          onChange={(e) => setPerUserLimit(e.target.value)}
        />

        <Button type="submit" variant="primary" disabled={saving} className="md:col-span-5">
          {saving ? "Creating..." : (
            <>
              <Plus className="h-4 w-4" /> Create Coupon
            </>
          )}
        </Button>
      </form>

      <div className="overflow-hidden rounded-2xl border border-neutral-200/70 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <table className="w-full">
          <thead className="bg-neutral-50 dark:bg-neutral-800/50">
            <tr>
              <th className="p-4 text-left text-sm font-semibold text-neutral-500">Code</th>
              <th className="p-4 text-left text-sm font-semibold text-neutral-500">Discount</th>
              <th className="p-4 text-left text-sm font-semibold text-neutral-500">Min Order</th>
              <th className="p-4 text-left text-sm font-semibold text-neutral-500">Expires</th>
              <th className="p-4 text-left text-sm font-semibold text-neutral-500">Usage</th>
              <th className="p-4 text-left text-sm font-semibold text-neutral-500">Status</th>
              <th className="p-4 text-left text-sm font-semibold text-neutral-500">Action</th>
            </tr>
          </thead>

          <tbody>
            {!loading && coupons.length === 0 && (
              <tr>
                <td colSpan={7} className="p-10 text-center text-neutral-400">
                  <Tag className="mx-auto mb-2 h-8 w-8 text-neutral-300" />
                  No coupons yet.
                </td>
              </tr>
            )}

            {coupons.map((coupon) => (
              <tr key={coupon.id} className="border-b border-neutral-100 dark:border-neutral-800">
                <td className="p-4 font-mono font-bold text-neutral-900 dark:text-white">
                  {coupon.code}
                </td>
                <td className="p-4 text-neutral-700 dark:text-neutral-200">
                  {coupon.type === "percent"
                    ? `${coupon.value}%`
                    : `₹${coupon.value}`}
                </td>
                <td className="p-4 text-neutral-600 dark:text-neutral-300">₹{coupon.minOrderAmount}</td>
                <td className="p-4 text-neutral-500">
                  {coupon.expiresAt
                    ? new Date(coupon.expiresAt).toLocaleDateString()
                    : "—"}
                </td>
                <td className="p-4 text-neutral-600 dark:text-neutral-300">
                  <div>
                    {coupon._count?.redemptions ?? 0}
                    {coupon.maxRedemptions ? ` / ${coupon.maxRedemptions}` : ""} used
                  </div>
                  {coupon.perUserLimit && (
                    <div className="text-xs text-neutral-400">
                      Max {coupon.perUserLimit} per customer
                    </div>
                  )}
                </td>
                <td className="p-4">
                  <Badge variant={coupon.active ? "success" : "secondary"}>
                    {coupon.active ? "Active" : "Disabled"}
                  </Badge>
                </td>
                <td className="p-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleActive(coupon)}
                      className="rounded-xl bg-blue-500 px-3 py-2 text-sm font-semibold text-white"
                    >
                      {coupon.active ? "Disable" : "Enable"}
                    </button>

                    <button
                      onClick={() => removeCoupon(coupon.id)}
                      className="rounded-xl bg-red-500 px-3 py-2 text-sm font-semibold text-white"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
