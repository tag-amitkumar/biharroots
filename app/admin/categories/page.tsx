"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  BarChart3,
  ChevronDown,
  ChevronRight,
  Pencil,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import ImageUploadInput from "@/components/ImageUploadInput";
import SafeImage from "@/components/SafeImage";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type Category = {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  banner: string;
  metaTitle: string;
  metaDescription: string;
  parentId: string | null;
  enabled: boolean;
  featured: boolean;
  showOnHomepage: boolean;
  showInNav: boolean;
  sortOrder: number;
  viewCount: number;
  _count: { products: number };
};

type FormState = {
  name: string;
  description: string;
  icon: string;
  banner: string;
  metaTitle: string;
  metaDescription: string;
  featured: boolean;
  showOnHomepage: boolean;
  showInNav: boolean;
};

const EMPTY_FORM: FormState = {
  name: "",
  description: "",
  icon: "",
  banner: "",
  metaTitle: "",
  metaDescription: "",
  featured: false,
  showOnHomepage: true,
  showInNav: true,
};

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[] | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [parentIdForCreate, setParentIdForCreate] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  function loadCategories() {
    fetch("/api/admin/categories")
      .then((res) => res.json())
      .then((data) => setCategories(data))
      .catch(() => setCategories([]));
  }

  useEffect(() => {
    loadCategories();
  }, []);

  const mainCategories = (categories ?? [])
    .filter((c) => !c.parentId)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  function childrenOf(parentId: string) {
    return (categories ?? [])
      .filter((c) => c.parentId === parentId)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  function toggleExpanded(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function openCreateDialog(parentId: string | null) {
    setEditingId(null);
    setParentIdForCreate(parentId);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }

  function openEditDialog(category: Category) {
    setEditingId(category.id);
    setParentIdForCreate(category.parentId);
    setForm({
      name: category.name,
      description: category.description,
      icon: category.icon,
      banner: category.banner,
      metaTitle: category.metaTitle,
      metaDescription: category.metaDescription,
      featured: category.featured,
      showOnHomepage: category.showOnHomepage,
      showInNav: category.showInNav,
    });
    setDialogOpen(true);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.name.trim()) {
      toast.error("Category name is required");
      return;
    }

    setSaving(true);

    try {
      const url = editingId ? `/api/admin/categories/${editingId}` : "/api/admin/categories";
      const method = editingId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          ...(editingId ? {} : { parentId: parentIdForCreate }),
        }),
      });

      const data = await res.json();

      if (!data.success) {
        toast.error(data.error || "Could not save category");
        return;
      }

      toast.success(editingId ? "Category updated" : "Category created");
      setDialogOpen(false);
      loadCategories();
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function patchCategory(id: string, patch: Partial<Category>) {
    const res = await fetch(`/api/admin/categories/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });

    const data = await res.json();

    if (!data.success) {
      toast.error(data.error || "Could not update category");
      return;
    }

    loadCategories();
  }

  async function removeCategory(category: Category) {
    const childCount = category.parentId ? 0 : childrenOf(category.id).length;
    const warning = childCount > 0
      ? `Delete "${category.name}" and all ${childCount} of its subcategories?`
      : `Delete "${category.name}"?`;

    if (!confirm(warning)) return;

    const res = await fetch(`/api/admin/categories/${category.id}`, { method: "DELETE" });
    const data = await res.json();

    if (!data.success) {
      toast.error("Could not delete category");
      return;
    }

    toast.success("Category deleted");
    loadCategories();
  }

  async function move(category: Category, direction: -1 | 1) {
    const siblings = category.parentId ? childrenOf(category.parentId) : mainCategories;
    const index = siblings.findIndex((s) => s.id === category.id);
    const targetIndex = index + direction;

    if (targetIndex < 0 || targetIndex >= siblings.length) return;

    const reordered = [...siblings];
    [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];

    await fetch("/api/admin/categories/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderedIds: reordered.map((c) => c.id) }),
    });

    loadCategories();
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-brand-600">
            Catalog
          </p>
          <h1 className="mt-2 font-display text-4xl font-extrabold text-neutral-900 dark:text-white">
            Categories
          </h1>
        </div>

        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/admin/categories/analytics">
              <BarChart3 className="h-4 w-4" /> Analytics
            </Link>
          </Button>

          <Button variant="primary" onClick={() => openCreateDialog(null)}>
            <Plus className="h-4 w-4" /> Add Main Category
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {categories === null ? (
          <div className="h-40 animate-pulse rounded-3xl bg-neutral-200 dark:bg-neutral-800" />
        ) : (
          mainCategories.map((category, index) => {
            const children = childrenOf(category.id);
            const isExpanded = expanded.has(category.id);

            return (
              <div
                key={category.id}
                className="overflow-hidden rounded-2xl border border-neutral-200/70 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
              >
                <div className="flex flex-wrap items-center gap-3 p-4">
                  <button
                    onClick={() => toggleExpanded(category.id)}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>

                  <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg">
                    <SafeImage
                      src={category.banner}
                      alt=""
                      fill
                      sizes="40px"
                      className="object-cover"
                      kind="category"
                    />
                  </div>

                  <span className="text-2xl">{category.icon || "🌿"}</span>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-neutral-900 dark:text-white">{category.name}</p>
                      {!category.enabled && <Badge variant="secondary">Disabled</Badge>}
                      {category.featured && <Badge variant="success">Featured</Badge>}
                    </div>
                    <p className="text-xs text-neutral-400">
                      /{category.slug} · {children.length} subcategories · {category._count.products} products
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => move(category, -1)}
                      disabled={index === 0}
                      aria-label="Move up"
                      className="rounded-lg p-2 text-neutral-400 hover:bg-neutral-100 disabled:opacity-30 dark:hover:bg-neutral-800"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => move(category, 1)}
                      disabled={index === mainCategories.length - 1}
                      aria-label="Move down"
                      className="rounded-lg p-2 text-neutral-400 hover:bg-neutral-100 disabled:opacity-30 dark:hover:bg-neutral-800"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </button>
                  </div>

                  <button
                    onClick={() => patchCategory(category.id, { enabled: !category.enabled })}
                    className={cn(
                      "rounded-xl px-3 py-1.5 text-xs font-semibold text-white",
                      category.enabled ? "bg-blue-500" : "bg-neutral-400"
                    )}
                  >
                    {category.enabled ? "Enabled" : "Disabled"}
                  </button>

                  <button
                    onClick={() => patchCategory(category.id, { featured: !category.featured })}
                    className={cn(
                      "rounded-xl px-3 py-1.5 text-xs font-semibold",
                      category.featured
                        ? "bg-amber-500 text-white"
                        : "border border-neutral-200 text-neutral-500 dark:border-neutral-700"
                    )}
                  >
                    Featured
                  </button>

                  <button
                    onClick={() => openCreateDialog(category.id)}
                    className="rounded-xl border border-neutral-200 px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:border-brand-300 dark:border-neutral-700 dark:text-neutral-200"
                  >
                    + Subcategory
                  </button>

                  <button
                    onClick={() => openEditDialog(category)}
                    aria-label="Edit"
                    className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>

                  <button
                    onClick={() => removeCategory(category)}
                    aria-label="Delete"
                    className="rounded-lg p-2 text-neutral-500 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {isExpanded && (
                  <div className="border-t border-neutral-100 bg-neutral-50/60 dark:border-neutral-800 dark:bg-neutral-900/40">
                    {children.length === 0 ? (
                      <p className="p-4 text-sm text-neutral-400">No subcategories yet.</p>
                    ) : (
                      children.map((child, childIndex) => (
                        <div
                          key={child.id}
                          className="flex flex-wrap items-center gap-3 border-b border-neutral-100 p-3 pl-14 last:border-b-0 dark:border-neutral-800"
                        >
                          <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg">
                            <SafeImage
                              src={child.banner}
                              alt=""
                              fill
                              sizes="36px"
                              className="object-cover"
                              kind="category"
                            />
                          </div>

                          <span className="text-lg">{child.icon || "🌿"}</span>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-neutral-800 dark:text-neutral-100">
                                {child.name}
                              </p>
                              {!child.enabled && <Badge variant="secondary">Disabled</Badge>}
                              {child.featured && <Badge variant="success">Featured</Badge>}
                            </div>
                            <p className="text-xs text-neutral-400">
                              /{child.slug} · {child._count.products} products
                            </p>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => move(child, -1)}
                              disabled={childIndex === 0}
                              aria-label="Move up"
                              className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 disabled:opacity-30 dark:hover:bg-neutral-800"
                            >
                              <ArrowUp className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => move(child, 1)}
                              disabled={childIndex === children.length - 1}
                              aria-label="Move down"
                              className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 disabled:opacity-30 dark:hover:bg-neutral-800"
                            >
                              <ArrowDown className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          <button
                            onClick={() => patchCategory(child.id, { enabled: !child.enabled })}
                            className={cn(
                              "rounded-xl px-2.5 py-1 text-xs font-semibold text-white",
                              child.enabled ? "bg-blue-500" : "bg-neutral-400"
                            )}
                          >
                            {child.enabled ? "Enabled" : "Disabled"}
                          </button>

                          <button
                            onClick={() => patchCategory(child.id, { featured: !child.featured })}
                            className={cn(
                              "rounded-xl px-2.5 py-1 text-xs font-semibold",
                              child.featured
                                ? "bg-amber-500 text-white"
                                : "border border-neutral-200 text-neutral-500 dark:border-neutral-700"
                            )}
                          >
                            Featured
                          </button>

                          <button
                            onClick={() => openEditDialog(child)}
                            aria-label="Edit"
                            className="rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>

                          <button
                            onClick={() => removeCategory(child)}
                            aria-label="Delete"
                            className="rounded-lg p-1.5 text-neutral-500 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <form onSubmit={submit}>
            <DialogHeader>
              <DialogTitle>
                {editingId
                  ? "Edit Category"
                  : parentIdForCreate
                    ? "Add Subcategory"
                    : "Add Main Category"}
              </DialogTitle>
            </DialogHeader>

            <div className="mt-4 space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="icon">Icon (emoji)</Label>
                <Input
                  id="icon"
                  value={form.icon}
                  onChange={(e) => setForm({ ...form, icon: e.target.value })}
                  placeholder="🥦"
                  className="mt-1.5"
                />
              </div>

              <ImageUploadInput
                id="banner"
                label="Banner Image"
                value={form.banner}
                onChange={(url) => setForm({ ...form, banner: url })}
                kind="category"
              />

              <div>
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  className="mt-1.5 w-full rounded-2xl border border-neutral-200 bg-white p-4 text-sm outline-none focus:border-brand-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-50"
                />
              </div>

              <div>
                <Label htmlFor="metaTitle">Meta Title (SEO)</Label>
                <Input
                  id="metaTitle"
                  value={form.metaTitle}
                  onChange={(e) => setForm({ ...form, metaTitle: e.target.value })}
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="metaDescription">Meta Description (SEO)</Label>
                <textarea
                  id="metaDescription"
                  value={form.metaDescription}
                  onChange={(e) => setForm({ ...form, metaDescription: e.target.value })}
                  rows={2}
                  className="mt-1.5 w-full rounded-2xl border border-neutral-200 bg-white p-4 text-sm outline-none focus:border-brand-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-50"
                />
              </div>

              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 dark:text-neutral-200">
                  <input
                    type="checkbox"
                    checked={form.featured}
                    onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                    className="h-4 w-4 rounded"
                  />
                  Featured
                </label>

                <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 dark:text-neutral-200">
                  <input
                    type="checkbox"
                    checked={form.showOnHomepage}
                    onChange={(e) => setForm({ ...form, showOnHomepage: e.target.checked })}
                    className="h-4 w-4 rounded"
                  />
                  Show on Homepage
                </label>

                <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 dark:text-neutral-200">
                  <input
                    type="checkbox"
                    checked={form.showInNav}
                    onChange={(e) => setForm({ ...form, showInNav: e.target.checked })}
                    className="h-4 w-4 rounded"
                  />
                  Show in Navigation
                </label>
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>

              <Button type="submit" variant="primary" disabled={saving}>
                {saving ? "Saving..." : editingId ? "Save Changes" : "Create Category"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
