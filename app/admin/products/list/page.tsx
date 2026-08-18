"use client";

import { useEffect, useMemo, useState } from "react";
import SafeImage from "@/components/SafeImage";
import Link from "next/link";
import { toast } from "sonner";
import { AlertTriangle, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Product = {
  id: string;
  name: string;
  price: number;
  image: string;
  stock: number;
};

type QualityReport = { productId: string; score: number; issues: { severity: "critical" | "recommended" }[] };
type QualitySummary = {
  totalProducts: number;
  productsWithCriticalIssues: number;
  productsWithAnyIssue: number;
  averageScore: number;
};

function qualityBadgeClass(score: number) {
  if (score >= 90) return "bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300";
  if (score >= 60) return "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300";
  return "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300";
}

export default function ProductListPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [qualityByProductId, setQualityByProductId] = useState<Map<string, QualityReport>>(new Map());
  const [qualitySummary, setQualitySummary] = useState<QualitySummary | null>(null);

  function loadProducts() {
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => setProducts(data));
  }

  function loadQualityReport() {
    fetch("/api/admin/products/quality-report")
      .then((res) => res.json())
      .then((data: { summary: QualitySummary; reports: QualityReport[] }) => {
        setQualitySummary(data.summary);
        setQualityByProductId(new Map(data.reports.map((r) => [r.productId, r])));
      })
      .catch(() => {
        setQualitySummary(null);
        setQualityByProductId(new Map());
      });
  }

  async function deleteProduct(id: string) {
    if (!confirm("Delete Product?")) return;

    await fetch(`/api/products/${id}`, {
      method: "DELETE",
    });

    toast.success("Product deleted");
    loadProducts();
  }

  useEffect(() => {
    loadProducts();
    loadQualityReport();
  }, []);

  const filtered = useMemo(
    () =>
      products.filter((product) =>
        product.name.toLowerCase().includes(search.toLowerCase())
      ),
    [products, search]
  );

  return (
    <div className="p-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-brand-600">
            Catalog
          </p>
          <h1 className="mt-2 font-display text-4xl font-extrabold text-neutral-900 dark:text-white">
            Products
          </h1>
        </div>

        <Button asChild variant="primary">
          <Link href="/admin/products">
            <Plus className="h-4 w-4" /> Add Product
          </Link>
        </Button>
      </div>

      {qualitySummary && qualitySummary.productsWithAnyIssue > 0 && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
          <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
          <p>
            <strong>{qualitySummary.productsWithAnyIssue}</strong> of{" "}
            <strong>{qualitySummary.totalProducts}</strong> products have missing or incomplete
            information ({qualitySummary.productsWithCriticalIssues} with critical issues). Average
            quality score: <strong>{qualitySummary.averageScore}%</strong>.
          </p>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-neutral-200/70 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex items-center gap-3 border-b border-neutral-200/70 p-4 dark:border-neutral-800">
          <div className="relative max-w-xs flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <Input
              placeholder="Search products"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <p className="ml-auto text-sm text-neutral-400">
            {filtered.length} of {products.length} products
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50 dark:bg-neutral-800/50">
              <tr>
                <th className="p-4 text-left text-sm font-semibold text-neutral-500">Image</th>
                <th className="p-4 text-left text-sm font-semibold text-neutral-500">Name</th>
                <th className="p-4 text-left text-sm font-semibold text-neutral-500">Price</th>
                <th className="p-4 text-left text-sm font-semibold text-neutral-500">Stock</th>
                <th className="p-4 text-left text-sm font-semibold text-neutral-500">Quality</th>
                <th className="p-4 text-left text-sm font-semibold text-neutral-500">Action</th>
              </tr>
            </thead>

            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-neutral-400">
                    No products match your search.
                  </td>
                </tr>
              ) : (
                filtered.map((product) => {
                  const quality = qualityByProductId.get(product.id);

                  return (
                  <tr key={product.id} className="border-b border-neutral-100 dark:border-neutral-800">
                    <td className="p-4">
                      <div className="relative h-14 w-14 overflow-hidden rounded-xl">
                        <SafeImage
                          alt={product.name}
                          src={product.image}
                          fill
                          sizes="56px"
                          className="object-cover"
                        />
                      </div>
                    </td>

                    <td className="p-4 text-neutral-900 dark:text-white">{product.name}</td>

                    <td className="p-4 font-semibold text-neutral-900 dark:text-white">
                      ₹{product.price}
                    </td>

                    <td className="p-4 text-neutral-600 dark:text-neutral-300">{product.stock}</td>

                    <td className="p-4">
                      {quality ? (
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${qualityBadgeClass(quality.score)}`}
                        >
                          {quality.score}%
                          {quality.issues.some((i) => i.severity === "critical") && " ⚠"}
                        </span>
                      ) : (
                        <span className="text-xs text-neutral-400">—</span>
                      )}
                    </td>

                    <td className="p-4">
                      <div className="flex gap-2">
                        <Link
                          href={`/admin/products/edit/${product.id}`}
                          className="flex items-center gap-1 rounded-xl bg-blue-500 px-3 py-2 text-sm font-semibold text-white"
                        >
                          <Pencil className="h-3.5 w-3.5" /> Edit
                        </Link>

                        <button
                          onClick={() => deleteProduct(product.id)}
                          className="flex items-center gap-1 rounded-xl bg-red-500 px-3 py-2 text-sm font-semibold text-white"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
