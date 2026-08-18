"use client";

import { Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export type VariantRow = { label: string; price: string; stock: string };

export default function VariantEditor({
  variants,
  onChange,
}: {
  variants: VariantRow[];
  onChange: (next: VariantRow[]) => void;
}) {
  function updateRow(index: number, field: keyof VariantRow, value: string) {
    onChange(
      variants.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );
  }

  function addRow() {
    onChange([...variants, { label: "", price: "", stock: "" }]);
  }

  function removeRow(index: number) {
    onChange(variants.filter((_, i) => i !== index));
  }

  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-neutral-700 dark:text-neutral-200">
        Pack Size Variants (optional)
      </label>

      <div className="space-y-2">
        {variants.map((row, index) => (
          <div key={index} className="flex gap-2">
            <Input
              placeholder="Label (e.g. 500g)"
              value={row.label}
              onChange={(e) => updateRow(index, "label", e.target.value)}
              className="flex-1"
            />

            <Input
              placeholder="Price"
              type="number"
              value={row.price}
              onChange={(e) => updateRow(index, "price", e.target.value)}
              className="w-24"
            />

            <Input
              placeholder="Stock"
              type="number"
              value={row.stock}
              onChange={(e) => updateRow(index, "stock", e.target.value)}
              className="w-24"
            />

            <button
              type="button"
              onClick={() => removeRow(index)}
              aria-label="Remove variant"
              className="rounded-xl border border-neutral-200 px-3 text-neutral-400 hover:border-red-200 hover:text-red-500 dark:border-neutral-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      <Button type="button" variant="outline" size="sm" onClick={addRow} className="mt-3">
        <Plus className="h-4 w-4" /> Add Variant
      </Button>
    </div>
  );
}
