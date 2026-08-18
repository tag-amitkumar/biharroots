"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";
import { MapPin, Plus, Star, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Address = {
  id: string;
  label: string;
  line1: string;
  city: string;
  state: string;
  postalCode: string;
  phone: string;
  isDefault: boolean;
};

const EMPTY_FORM = {
  label: "Home",
  line1: "",
  city: "",
  state: "",
  postalCode: "",
  phone: "",
  isDefault: false,
};

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[] | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);

  function loadAddresses() {
    fetch("/api/account/addresses")
      .then((res) => res.json())
      .then((data) => setAddresses(data))
      .catch(() => setAddresses([]));
  }

  useEffect(() => {
    loadAddresses();
  }, []);

  async function addAddress(e: React.FormEvent) {
    e.preventDefault();

    const res = await fetch("/api/account/addresses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      toast.error(data?.error || "Could not add address");
      return;
    }

    toast.success("Address added");
    setForm(EMPTY_FORM);
    setShowForm(false);
    loadAddresses();
  }

  async function setDefault(id: string) {
    await fetch(`/api/account/addresses/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isDefault: true }),
    });

    toast.success("Default address updated");
    loadAddresses();
  }

  async function removeAddress(id: string) {
    if (!confirm("Delete this address?")) return;

    await fetch(`/api/account/addresses/${id}`, { method: "DELETE" });
    toast.success("Address removed");
    loadAddresses();
  }

  return (
    <div className="rounded-3xl border border-neutral-200/70 bg-white p-8 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">Addresses</h2>

        <Button
          variant={showForm ? "outline" : "primary"}
          size="sm"
          onClick={() => setShowForm((prev) => !prev)}
        >
          {showForm ? "Cancel" : (
            <>
              <Plus className="h-4 w-4" /> Add Address
            </>
          )}
        </Button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={addAddress}
            className="mb-8 grid gap-3 overflow-hidden rounded-2xl border border-neutral-200 p-4 dark:border-neutral-700 sm:grid-cols-2"
          >
            <Input
              placeholder="Label (e.g. Home, Office)"
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
            />

            <Input
              placeholder="Phone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />

            <Input
              placeholder="Address Line"
              value={form.line1}
              onChange={(e) => setForm({ ...form, line1: e.target.value })}
              className="sm:col-span-2"
            />

            <Input
              placeholder="City"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
            />

            <Input
              placeholder="State"
              value={form.state}
              onChange={(e) => setForm({ ...form, state: e.target.value })}
            />

            <Input
              placeholder="Postal Code"
              value={form.postalCode}
              onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
            />

            <label className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-300">
              <input
                type="checkbox"
                checked={form.isDefault}
                onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
              />
              Set as default
            </label>

            <Button type="submit" variant="primary" className="sm:col-span-2">
              Save Address
            </Button>
          </motion.form>
        )}
      </AnimatePresence>

      {addresses === null ? (
        <p className="text-neutral-500">Loading...</p>
      ) : addresses.length === 0 ? (
        <div className="py-10 text-center">
          <MapPin className="mx-auto h-10 w-10 text-neutral-300" />
          <p className="mt-3 text-neutral-500">No saved addresses yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {addresses.map((address) => (
            <div
              key={address.id}
              className="flex items-start justify-between rounded-2xl border border-neutral-200/70 p-4 dark:border-neutral-800"
            >
              <div>
                <p className="flex items-center gap-2 font-bold text-neutral-900 dark:text-white">
                  {address.label}
                  {address.isDefault && <Badge variant="success">Default</Badge>}
                </p>
                <p className="mt-1 text-neutral-600 dark:text-neutral-300">{address.line1}</p>
                <p className="text-neutral-600 dark:text-neutral-300">
                  {address.city}, {address.state} {address.postalCode}
                </p>
                <p className="text-neutral-400">{address.phone}</p>
              </div>

              <div className="flex flex-col items-end gap-2 text-sm">
                {!address.isDefault && (
                  <button
                    onClick={() => setDefault(address.id)}
                    className="flex items-center gap-1 font-semibold text-brand-600 hover:underline"
                  >
                    <Star className="h-3.5 w-3.5" /> Set Default
                  </button>
                )}

                <button
                  onClick={() => removeAddress(address.id)}
                  className="flex items-center gap-1 font-semibold text-red-500 hover:underline"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
