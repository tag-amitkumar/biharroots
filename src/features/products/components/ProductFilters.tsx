"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { ProductSort } from "@/features/products/service";
import { getAllProducts } from "@/features/products/productsCache";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

export type FilterState = {
  category: string;
  sort: ProductSort;
  minPrice: string;
  maxPrice: string;
  brand: string;
  countryOfOrigin: string;
  rating: string;
  availability: "" | "in-stock" | "out-of-stock";
  organicCertified: boolean;
  vegan: boolean;
  glutenFree: boolean;
  sugarFree: boolean;
  ecoFriendly: boolean;
  discount: boolean;
  newArrival: boolean;
  bestSeller: boolean;
};

// Shared by /shop and the category product grid, so both build the same
// query string from a FilterState without duplicating the field list.
export function buildFilterSearchParams(filters: FilterState) {
  const params = new URLSearchParams();

  if (filters.category) params.set("category", filters.category);
  if (filters.sort) params.set("sort", filters.sort);
  if (filters.minPrice) params.set("minPrice", filters.minPrice);
  if (filters.maxPrice) params.set("maxPrice", filters.maxPrice);
  if (filters.brand) params.set("brand", filters.brand);
  if (filters.countryOfOrigin) params.set("countryOfOrigin", filters.countryOfOrigin);
  if (filters.rating) params.set("rating", filters.rating);
  if (filters.availability) params.set("availability", filters.availability);
  if (filters.organicCertified) params.set("organicCertified", "true");
  if (filters.vegan) params.set("vegan", "true");
  if (filters.glutenFree) params.set("glutenFree", "true");
  if (filters.sugarFree) params.set("sugarFree", "true");
  if (filters.ecoFriendly) params.set("ecoFriendly", "true");
  if (filters.discount) params.set("discount", "true");
  if (filters.newArrival) params.set("newArrival", "true");
  if (filters.bestSeller) params.set("bestSeller", "true");

  return params;
}

export const DEFAULT_FILTERS: FilterState = {
  category: "",
  sort: "newest",
  minPrice: "",
  maxPrice: "",
  brand: "",
  countryOfOrigin: "",
  rating: "",
  availability: "",
  organicCertified: false,
  vegan: false,
  glutenFree: false,
  sugarFree: false,
  ecoFriendly: false,
  discount: false,
  newArrival: false,
  bestSeller: false,
};

const SORT_OPTIONS: { value: ProductSort; label: string }[] = [
  { value: "popularity", label: "Popularity" },
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "rating", label: "Highest Rated" },
  { value: "best-selling", label: "Best Selling" },
  { value: "most-reviewed", label: "Most Reviewed" },
];

const ATTRIBUTE_TOGGLES: { key: keyof FilterState; label: string }[] = [
  { key: "organicCertified", label: "Organic Certified" },
  { key: "vegan", label: "Vegan" },
  { key: "glutenFree", label: "Gluten Free" },
  { key: "sugarFree", label: "Sugar Free" },
  { key: "ecoFriendly", label: "Eco Friendly" },
  { key: "discount", label: "On Sale" },
  { key: "newArrival", label: "New Arrival" },
  { key: "bestSeller", label: "Best Seller" },
];

const DEFAULT_PRICE_CEILING = 2000;

export default function ProductFilters({
  filters,
  onChange,
  hideCategoryFilter = false,
}: {
  filters: FilterState;
  onChange: (next: Partial<FilterState>) => void;
  hideCategoryFilter?: boolean;
}) {
  const [categories, setCategories] = useState<string[]>([]);
  const [facets, setFacets] = useState<{ brands: string[]; countries: string[] }>({
    brands: [],
    countries: [],
  });
  const [priceCeiling, setPriceCeiling] = useState(DEFAULT_PRICE_CEILING);

  useEffect(() => {
    if (!hideCategoryFilter) {
      fetch("/api/products/categories")
        .then((res) => res.json())
        .then((data) => setCategories(data))
        .catch(() => setCategories([]));
    }

    fetch("/api/products/facets")
      .then((res) => res.json())
      .then((data) => setFacets(data))
      .catch(() => setFacets({ brands: [], countries: [] }));

    getAllProducts().then((products) => {
      if (products.length === 0) return;

      const highest = Math.max(...products.map((p) => p.price));
      setPriceCeiling(Math.max(highest, DEFAULT_PRICE_CEILING));
    });
  }, [hideCategoryFilter]);

  const hasActiveFilters =
    filters.category ||
    filters.minPrice ||
    filters.maxPrice ||
    filters.brand ||
    filters.countryOfOrigin ||
    filters.rating ||
    filters.availability ||
    filters.organicCertified ||
    filters.vegan ||
    filters.glutenFree ||
    filters.sugarFree ||
    filters.ecoFriendly ||
    filters.discount ||
    filters.newArrival ||
    filters.bestSeller ||
    filters.sort !== "newest";

  const sliderValue = [
    filters.minPrice ? Number(filters.minPrice) : 0,
    filters.maxPrice ? Number(filters.maxPrice) : priceCeiling,
  ];

  return (
    <div className="space-y-8 rounded-3xl border border-neutral-200/70 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-bold text-neutral-900 dark:text-white">
          Filters
        </h3>

        {hasActiveFilters && (
          <button
            onClick={() => onChange(DEFAULT_FILTERS)}
            className="flex items-center gap-1 text-sm font-semibold text-brand-600 hover:underline"
          >
            <X className="h-3.5 w-3.5" /> Clear
          </button>
        )}
      </div>

      {!hideCategoryFilter && (
        <div>
          <p className="mb-3 text-sm font-semibold text-neutral-700 dark:text-neutral-200">
            Category
          </p>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => onChange({ category: "" })}
              className={cn(
                "rounded-full border px-4 py-1.5 text-sm font-medium capitalize transition-colors",
                filters.category === ""
                  ? "border-brand-600 bg-brand-600 text-white"
                  : "border-neutral-200 text-neutral-600 hover:border-brand-300 dark:border-neutral-700 dark:text-neutral-300"
              )}
            >
              All
            </button>

            {categories.map((category) => (
              <button
                key={category}
                onClick={() => onChange({ category })}
                className={cn(
                  "rounded-full border px-4 py-1.5 text-sm font-medium capitalize transition-colors",
                  filters.category === category
                    ? "border-brand-600 bg-brand-600 text-white"
                    : "border-neutral-200 text-neutral-600 hover:border-brand-300 dark:border-neutral-700 dark:text-neutral-300"
                )}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="mb-4 text-sm font-semibold text-neutral-700 dark:text-neutral-200">
          Price Range
        </p>

        <Slider
          min={0}
          max={priceCeiling}
          step={10}
          value={sliderValue}
          onValueChange={([min, max]) =>
            onChange({ minPrice: String(min), maxPrice: String(max) })
          }
        />

        <div className="mt-3 flex items-center justify-between text-sm text-neutral-500">
          <span>₹{sliderValue[0]}</span>
          <span>₹{sliderValue[1]}</span>
        </div>
      </div>

      {facets.brands.length > 0 && (
        <div>
          <label className="mb-2 block text-sm font-semibold text-neutral-700 dark:text-neutral-200">
            Brand
          </label>

          <select
            value={filters.brand}
            onChange={(e) => onChange({ brand: e.target.value })}
            className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm text-neutral-900 outline-none focus:border-brand-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-50"
          >
            <option value="">All Brands</option>
            {facets.brands.map((brand) => (
              <option key={brand} value={brand}>
                {brand}
              </option>
            ))}
          </select>
        </div>
      )}

      {facets.countries.length > 0 && (
        <div>
          <label className="mb-2 block text-sm font-semibold text-neutral-700 dark:text-neutral-200">
            Country of Origin
          </label>

          <select
            value={filters.countryOfOrigin}
            onChange={(e) => onChange({ countryOfOrigin: e.target.value })}
            className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm text-neutral-900 outline-none focus:border-brand-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-50"
          >
            <option value="">Any Country</option>
            {facets.countries.map((country) => (
              <option key={country} value={country}>
                {country}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="mb-2 block text-sm font-semibold text-neutral-700 dark:text-neutral-200">
          Rating
        </label>

        <select
          value={filters.rating}
          onChange={(e) => onChange({ rating: e.target.value })}
          className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm text-neutral-900 outline-none focus:border-brand-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-50"
        >
          <option value="">Any Rating</option>
          <option value="4">4★ &amp; up</option>
          <option value="3">3★ &amp; up</option>
          <option value="2">2★ &amp; up</option>
        </select>
      </div>

      <div>
        <p className="mb-3 text-sm font-semibold text-neutral-700 dark:text-neutral-200">
          Availability
        </p>

        <div className="flex flex-wrap gap-2">
          {(["", "in-stock", "out-of-stock"] as const).map((value) => (
            <button
              key={value}
              onClick={() => onChange({ availability: value })}
              className={cn(
                "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                filters.availability === value
                  ? "border-brand-600 bg-brand-600 text-white"
                  : "border-neutral-200 text-neutral-600 hover:border-brand-300 dark:border-neutral-700 dark:text-neutral-300"
              )}
            >
              {value === "" ? "All" : value === "in-stock" ? "In Stock" : "Out of Stock"}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-3 text-sm font-semibold text-neutral-700 dark:text-neutral-200">
          Attributes
        </p>

        <div className="space-y-2">
          {ATTRIBUTE_TOGGLES.map((toggle) => (
            <label
              key={toggle.key}
              className="flex items-center gap-2 text-sm font-medium text-neutral-700 dark:text-neutral-200"
            >
              <input
                type="checkbox"
                checked={Boolean(filters[toggle.key])}
                onChange={(e) => onChange({ [toggle.key]: e.target.checked } as Partial<FilterState>)}
                className="h-3.5 w-3.5 rounded"
              />
              {toggle.label}
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-3 block text-sm font-semibold text-neutral-700 dark:text-neutral-200">
          Sort By
        </label>

        <select
          value={filters.sort}
          onChange={(e) => onChange({ sort: e.target.value as ProductSort })}
          className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm text-neutral-900 outline-none focus:border-brand-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-50"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
