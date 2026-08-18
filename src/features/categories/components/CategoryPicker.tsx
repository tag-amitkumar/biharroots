"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Label } from "@/components/ui/label";

type Category = {
  id: string;
  name: string;
  parentId: string | null;
};

// Reusable checkbox tree for assigning a product to any number of
// categories/subcategories at once (the many-to-many ProductCategory
// relationship) - used by both the admin create and edit product forms.
export default function CategoryPicker({
  value,
  onChange,
}: {
  value: string[];
  onChange: (categoryIds: string[]) => void;
}) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch("/api/admin/categories")
      .then((res) => res.json())
      .then((data: Category[]) => setCategories(data))
      .catch(() => setCategories([]));
  }, []);

  const mainCategories = categories.filter((c) => !c.parentId);

  function childrenOf(parentId: string) {
    return categories.filter((c) => c.parentId === parentId);
  }

  function toggle(id: string) {
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
  }

  function toggleExpanded(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div>
      <Label>Categories</Label>

      <div className="mt-1.5 max-h-64 space-y-1 overflow-y-auto rounded-2xl border border-neutral-200 p-3 dark:border-neutral-700">
        {mainCategories.length === 0 ? (
          <p className="p-2 text-sm text-neutral-400">No categories available.</p>
        ) : (
          mainCategories.map((category) => {
            const children = childrenOf(category.id);
            const isExpanded = expanded.has(category.id);

            return (
              <div key={category.id}>
                <div className="flex items-center gap-2">
                  {children.length > 0 && (
                    <button
                      type="button"
                      onClick={() => toggleExpanded(category.id)}
                      className="flex h-5 w-5 shrink-0 items-center justify-center text-neutral-400"
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5" />
                      )}
                    </button>
                  )}

                  <label
                    className={`flex flex-1 items-center gap-2 py-1 text-sm font-semibold text-neutral-800 dark:text-neutral-100 ${children.length === 0 ? "pl-7" : ""}`}
                  >
                    <input
                      type="checkbox"
                      checked={value.includes(category.id)}
                      onChange={() => toggle(category.id)}
                      className="h-3.5 w-3.5 rounded"
                    />
                    {category.name}
                  </label>
                </div>

                {isExpanded && (
                  <div className="ml-7 space-y-1">
                    {children.map((child) => (
                      <label
                        key={child.id}
                        className="flex items-center gap-2 py-1 text-sm text-neutral-600 dark:text-neutral-300"
                      >
                        <input
                          type="checkbox"
                          checked={value.includes(child.id)}
                          onChange={() => toggle(child.id)}
                          className="h-3.5 w-3.5 rounded"
                        />
                        {child.name}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
