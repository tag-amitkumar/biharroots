"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import VariantEditor, {
  VariantRow,
} from "@/features/products/components/VariantEditor";
import CategoryPicker from "@/features/categories/components/CategoryPicker";
import AIDescriptionGenerator from "@/features/products/components/AIDescriptionGenerator";
import AdminToolsPanel from "@/features/products/components/AdminToolsPanel";
import ProductGalleryEditor from "@/features/products/components/ProductGalleryEditor";
import type { GeneratedProductContent } from "@/features/products/aiDescription";
import ImageUploadInput from "@/components/ImageUploadInput";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const ATTRIBUTE_CHECKBOXES: { key: string; label: string }[] = [
  { key: "organicCertified", label: "Organic Certified" },
  { key: "vegan", label: "Vegan" },
  { key: "glutenFree", label: "Gluten Free" },
  { key: "sugarFree", label: "Sugar Free" },
  { key: "ecoFriendly", label: "Eco Friendly" },
];

export default function ProductsAdminPage() {
  const formRef = useRef<HTMLFormElement>(null);
  const [loading, setLoading] = useState(false);
  const [variants, setVariants] = useState<VariantRow[]>([]);
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [featured, setFeatured] = useState(false);
  const [attributes, setAttributes] = useState<Record<string, boolean>>({});
  const [imageUrl, setImageUrl] = useState("");
  const [galleryImages, setGalleryImages] = useState<string[]>([]);

  function setFieldValue(name: string, value: string) {
    const field = formRef.current?.elements.namedItem(name);
    if (field && "value" in field) {
      (field as unknown as HTMLInputElement | HTMLTextAreaElement).value = value;
    }
  }

  function handleGenerated(content: GeneratedProductContent) {
    setFieldValue("description", content.shortDescription);
    setFieldValue("detailedDescription", content.detailedDescription);
    setFieldValue("seoTitle", content.seoTitle);
    setFieldValue("seoMetaDescription", content.seoMetaDescription);
    setFieldValue("highlightsText", content.highlights.join("\n"));
    setFieldValue("keyBenefitsText", content.keyBenefits.join("\n"));
    setFieldValue("ingredients", content.ingredients);
    setFieldValue("usageInstructions", content.usageInstructions);
    setFieldValue("storageInstructions", content.storageInstructions);
    setFieldValue(
      "faqsText",
      content.faqs.map((faq) => `Q: ${faq.question}\nA: ${faq.answer}`).join("\n\n")
    );
  }

  function handleMetadataSuggested(result: {
    seoKeywords: { keywords: string[] };
    tags: { tags: string[] };
    altText: { altText: string };
  }) {
    setFieldValue("seoKeywordsText", result.seoKeywords.keywords.join("\n"));
    setFieldValue("tagsText", result.tags.tags.join("\n"));
    setFieldValue("imageAlt", result.altText.altText);
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setLoading(true);

    const form = new FormData(e.currentTarget);
    const formEl = e.currentTarget;

    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          name: form.get("name"),
          description: form.get("description"),
          price: form.get("price"),
          image: imageUrl,
          category: form.get("category"),
          stock: form.get("stock"),
          images: galleryImages.join("\n"),
          specificationsText: form.get("specificationsText"),
          variants: variants.filter((v) => v.label.trim()),
          categoryIds,
          featured,
          brand: form.get("brand"),
          mrp: form.get("mrp"),
          countryOfOrigin: form.get("countryOfOrigin"),
          weight: form.get("weight"),
          seoTitle: form.get("seoTitle"),
          seoMetaDescription: form.get("seoMetaDescription"),
          detailedDescription: form.get("detailedDescription"),
          highlightsText: form.get("highlightsText"),
          keyBenefitsText: form.get("keyBenefitsText"),
          ingredients: form.get("ingredients"),
          usageInstructions: form.get("usageInstructions"),
          storageInstructions: form.get("storageInstructions"),
          faqsText: form.get("faqsText"),
          seoKeywordsText: form.get("seoKeywordsText"),
          tagsText: form.get("tagsText"),
          imageAlt: form.get("imageAlt"),
          ...attributes,
        }),
      });

      if (!res.ok) {
        toast.error("Could not add product");
        return;
      }

      toast.success("Product added");

      formEl.reset();
      setVariants([]);
      setCategoryIds([]);
      setFeatured(false);
      setAttributes({});
      setImageUrl("");
      setGalleryImages([]);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl p-8">
      <p className="text-sm font-semibold uppercase tracking-widest text-brand-600">
        Catalog
      </p>
      <h1 className="mb-8 mt-2 font-display text-4xl font-extrabold text-neutral-900 dark:text-white">
        Add Product
      </h1>

      <form
        ref={formRef}
        onSubmit={submit}
        className="space-y-4 rounded-3xl border border-neutral-200/70 bg-white p-8 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
      >
        <div>
          <Label htmlFor="name">Product Name</Label>
          <Input id="name" name="name" className="mt-1.5" />
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <textarea
            id="description"
            name="description"
            rows={3}
            className="mt-1.5 w-full rounded-2xl border border-neutral-200 bg-white p-4 text-sm outline-none focus:border-brand-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-50"
          />
        </div>

        <AIDescriptionGenerator
          getInput={() => {
            const form = formRef.current;
            return {
              name: (form?.elements.namedItem("name") as HTMLInputElement)?.value || "",
              category: (form?.elements.namedItem("category") as HTMLInputElement)?.value || undefined,
              brand: (form?.elements.namedItem("brand") as HTMLInputElement)?.value || undefined,
              price: Number((form?.elements.namedItem("price") as HTMLInputElement)?.value) || undefined,
              existingDescription:
                (form?.elements.namedItem("description") as HTMLTextAreaElement)?.value || undefined,
              countryOfOrigin:
                (form?.elements.namedItem("countryOfOrigin") as HTMLInputElement)?.value || undefined,
              weight: (form?.elements.namedItem("weight") as HTMLInputElement)?.value || undefined,
              organicCertified: attributes.organicCertified,
              vegan: attributes.vegan,
              glutenFree: attributes.glutenFree,
              sugarFree: attributes.sugarFree,
              ecoFriendly: attributes.ecoFriendly,
            };
          }}
          onGenerated={handleGenerated}
        />

        <div>
          <Label htmlFor="price">Price</Label>
          <Input id="price" name="price" className="mt-1.5" />
        </div>

        <ImageUploadInput id="image" label="Cover Photo" value={imageUrl} onChange={setImageUrl} />

        <ProductGalleryEditor images={galleryImages} onChange={setGalleryImages} />

        <div>
          <Label htmlFor="category">Category (legacy label)</Label>
          <Input id="category" name="category" className="mt-1.5" />
        </div>

        <div>
          <Label htmlFor="stock">Stock</Label>
          <Input id="stock" name="stock" className="mt-1.5" />
        </div>

        <div>
          <Label htmlFor="specificationsText">Specifications</Label>
          <textarea
            id="specificationsText"
            name="specificationsText"
            placeholder={'One per line as "Key: Value" (optional)\ne.g. Origin: India'}
            rows={3}
            className="mt-1.5 w-full rounded-2xl border border-neutral-200 bg-white p-4 text-sm outline-none focus:border-brand-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-50"
          />
        </div>

        <div>
          <Label htmlFor="detailedDescription">Detailed Description (product page)</Label>
          <textarea
            id="detailedDescription"
            name="detailedDescription"
            rows={4}
            className="mt-1.5 w-full rounded-2xl border border-neutral-200 bg-white p-4 text-sm outline-none focus:border-brand-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-50"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="seoTitle">SEO Title</Label>
            <Input id="seoTitle" name="seoTitle" className="mt-1.5" />
          </div>

          <div>
            <Label htmlFor="seoMetaDescription">SEO Meta Description</Label>
            <Input id="seoMetaDescription" name="seoMetaDescription" className="mt-1.5" />
          </div>
        </div>

        <div>
          <Label htmlFor="highlightsText">Highlights</Label>
          <textarea
            id="highlightsText"
            name="highlightsText"
            placeholder="One highlight per line (optional)"
            rows={3}
            className="mt-1.5 w-full rounded-2xl border border-neutral-200 bg-white p-4 text-sm outline-none focus:border-brand-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-50"
          />
        </div>

        <div>
          <Label htmlFor="keyBenefitsText">Key Benefits</Label>
          <textarea
            id="keyBenefitsText"
            name="keyBenefitsText"
            placeholder="One benefit per line (optional)"
            rows={3}
            className="mt-1.5 w-full rounded-2xl border border-neutral-200 bg-white p-4 text-sm outline-none focus:border-brand-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-50"
          />
        </div>

        <div>
          <Label htmlFor="ingredients">Ingredients</Label>
          <textarea
            id="ingredients"
            name="ingredients"
            rows={2}
            className="mt-1.5 w-full rounded-2xl border border-neutral-200 bg-white p-4 text-sm outline-none focus:border-brand-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-50"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="usageInstructions">Usage Instructions</Label>
            <textarea
              id="usageInstructions"
              name="usageInstructions"
              rows={2}
              className="mt-1.5 w-full rounded-2xl border border-neutral-200 bg-white p-4 text-sm outline-none focus:border-brand-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-50"
            />
          </div>

          <div>
            <Label htmlFor="storageInstructions">Storage Instructions</Label>
            <textarea
              id="storageInstructions"
              name="storageInstructions"
              rows={2}
              className="mt-1.5 w-full rounded-2xl border border-neutral-200 bg-white p-4 text-sm outline-none focus:border-brand-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-50"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="faqsText">FAQs</Label>
          <textarea
            id="faqsText"
            name="faqsText"
            placeholder={"One per block, separated by a blank line:\nQ: Is this organic?\nA: Yes."}
            rows={4}
            className="mt-1.5 w-full rounded-2xl border border-neutral-200 bg-white p-4 text-sm outline-none focus:border-brand-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-50"
          />
        </div>

        <AdminToolsPanel
          getInput={() => {
            const form = formRef.current;
            return {
              name: (form?.elements.namedItem("name") as HTMLInputElement)?.value || "",
              category: (form?.elements.namedItem("category") as HTMLInputElement)?.value || undefined,
              brand: (form?.elements.namedItem("brand") as HTMLInputElement)?.value || undefined,
              description:
                (form?.elements.namedItem("description") as HTMLTextAreaElement)?.value || undefined,
              organicCertified: attributes.organicCertified,
              vegan: attributes.vegan,
              glutenFree: attributes.glutenFree,
              sugarFree: attributes.sugarFree,
              ecoFriendly: attributes.ecoFriendly,
            };
          }}
          onGenerated={handleMetadataSuggested}
          onCategorySelected={(categoryId) =>
            setCategoryIds((prev) => (prev.includes(categoryId) ? prev : [...prev, categoryId]))
          }
          alreadySelectedCategoryIds={categoryIds}
        />

        <div>
          <Label htmlFor="seoKeywordsText">SEO Keywords</Label>
          <textarea
            id="seoKeywordsText"
            name="seoKeywordsText"
            placeholder="One keyword or phrase per line (optional)"
            rows={2}
            className="mt-1.5 w-full rounded-2xl border border-neutral-200 bg-white p-4 text-sm outline-none focus:border-brand-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-50"
          />
        </div>

        <div>
          <Label htmlFor="tagsText">Tags</Label>
          <textarea
            id="tagsText"
            name="tagsText"
            placeholder="One tag per line (optional)"
            rows={2}
            className="mt-1.5 w-full rounded-2xl border border-neutral-200 bg-white p-4 text-sm outline-none focus:border-brand-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-50"
          />
        </div>

        <div>
          <Label htmlFor="imageAlt">Image Alt Text</Label>
          <Input id="imageAlt" name="imageAlt" className="mt-1.5" />
        </div>

        <CategoryPicker value={categoryIds} onChange={setCategoryIds} />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="brand">Brand</Label>
            <Input id="brand" name="brand" className="mt-1.5" />
          </div>

          <div>
            <Label htmlFor="mrp">MRP (optional, for discount badge)</Label>
            <Input id="mrp" name="mrp" className="mt-1.5" />
          </div>

          <div>
            <Label htmlFor="countryOfOrigin">Country of Origin</Label>
            <Input id="countryOfOrigin" name="countryOfOrigin" className="mt-1.5" />
          </div>

          <div>
            <Label htmlFor="weight">Weight / Size</Label>
            <Input id="weight" name="weight" placeholder="500g" className="mt-1.5" />
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold text-neutral-700 dark:text-neutral-200">
            Attributes
          </p>

          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 dark:text-neutral-200">
              <input
                type="checkbox"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
                className="h-4 w-4 rounded"
              />
              Featured
            </label>

            {ATTRIBUTE_CHECKBOXES.map((attr) => (
              <label
                key={attr.key}
                className="flex items-center gap-2 text-sm font-medium text-neutral-700 dark:text-neutral-200"
              >
                <input
                  type="checkbox"
                  checked={Boolean(attributes[attr.key])}
                  onChange={(e) =>
                    setAttributes((prev) => ({ ...prev, [attr.key]: e.target.checked }))
                  }
                  className="h-4 w-4 rounded"
                />
                {attr.label}
              </label>
            ))}
          </div>
        </div>

        <VariantEditor variants={variants} onChange={setVariants} />

        <Button type="submit" variant="primary" disabled={loading} className="w-full">
          {loading ? "Adding..." : "Add Product"}
        </Button>
      </form>
    </div>
  );
}
