"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Tags } from "lucide-react";
import { Button } from "@/components/ui/button";

type ToolInput = {
  name: string;
  description?: string;
  category?: string;
  brand?: string;
  organicCertified?: boolean;
  vegan?: boolean;
  glutenFree?: boolean;
  sugarFree?: boolean;
  ecoFriendly?: boolean;
};

type CategorySuggestion = { categoryId: string; categoryName: string; score: number };

type SuggestMetadataResult = {
  seoKeywords: { keywords: string[]; source: "rule" | "llm" };
  tags: { tags: string[]; source: "rule" | "llm" };
  altText: { altText: string; source: "rule" | "llm" };
  categorySuggestions: CategorySuggestion[];
};

// Unlike AIDescriptionGenerator, this tool always has a real, honest
// deterministic fallback (keyword extraction, attribute-based tags, a
// data-driven alt-text template, keyword-overlap category matching), so
// it's never disabled - `source: "rule" | "llm"` on each result tells
// the admin which kind of suggestion they got instead of hiding that
// distinction.
export default function AdminToolsPanel({
  getInput,
  onGenerated,
  onCategorySelected,
  alreadySelectedCategoryIds,
}: {
  getInput: () => ToolInput;
  onGenerated: (result: SuggestMetadataResult) => void;
  onCategorySelected: (categoryId: string) => void;
  alreadySelectedCategoryIds: string[];
}) {
  const [generating, setGenerating] = useState(false);
  const [categorySuggestions, setCategorySuggestions] = useState<CategorySuggestion[]>([]);
  const [sources, setSources] = useState<{ keywords: string; tags: string; altText: string } | null>(null);

  async function handleSuggest() {
    const input = getInput();

    if (!input.name?.trim()) {
      toast.error("Enter a product name first");
      return;
    }

    setGenerating(true);

    try {
      const res = await fetch("/api/admin/products/suggest-metadata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      const data: SuggestMetadataResult = await res.json();

      if (!res.ok) {
        toast.error((data as unknown as { error?: string })?.error || "Could not generate suggestions");
        return;
      }

      onGenerated(data);
      setCategorySuggestions(data.categorySuggestions);
      setSources({
        keywords: data.seoKeywords.source,
        tags: data.tags.source,
        altText: data.altText.source,
      });
      toast.success("Suggestions generated - review and edit before saving");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50/50 p-4 dark:border-neutral-700 dark:bg-neutral-800/30">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-neutral-800 dark:text-neutral-100">
          <Tags className="h-4 w-4 text-neutral-500" aria-hidden="true" />
          SEO Keywords, Tags &amp; Alt Text
        </div>

        <Button type="button" variant="outline" size="sm" disabled={generating} onClick={handleSuggest}>
          {generating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Suggesting...
            </>
          ) : (
            "Suggest"
          )}
        </Button>
      </div>

      {sources && (
        <p className="mt-2 text-xs text-neutral-500">
          Keywords: {sources.keywords === "llm" ? "AI-generated" : "auto-extracted"} · Tags:{" "}
          {sources.tags === "llm" ? "AI-generated" : "auto-extracted"} · Alt text:{" "}
          {sources.altText === "llm" ? "AI-generated" : "auto-generated"}
        </p>
      )}

      {categorySuggestions.length > 0 && (
        <div className="mt-3">
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Suggested Categories
          </p>
          <div className="flex flex-wrap gap-2">
            {categorySuggestions.map((suggestion) => {
              const alreadySelected = alreadySelectedCategoryIds.includes(suggestion.categoryId);

              return (
                <button
                  key={suggestion.categoryId}
                  type="button"
                  disabled={alreadySelected}
                  onClick={() => onCategorySelected(suggestion.categoryId)}
                  className="rounded-full border border-brand-300 px-3 py-1 text-xs font-semibold text-brand-700 transition-colors hover:bg-brand-50 disabled:cursor-default disabled:opacity-50 dark:border-brand-800 dark:text-brand-400 dark:hover:bg-brand-950/30"
                >
                  {alreadySelected ? "✓ " : "+ "}
                  {suggestion.categoryName}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
