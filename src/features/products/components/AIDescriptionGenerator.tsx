"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { GeneratedProductContent, ProductContentInput } from "@/features/products/aiDescription";

// Genuinely LLM-dependent (there's no rule-based substitute for drafting
// original copy), so this honestly disables itself with an explanation
// instead of faking a "generated" result when no AI provider is configured.
export default function AIDescriptionGenerator({
  getInput,
  onGenerated,
}: {
  getInput: () => ProductContentInput;
  onGenerated: (content: GeneratedProductContent) => void;
}) {
  const [aiAvailable, setAiAvailable] = useState<boolean | null>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetch("/api/ai/status")
      .then((res) => res.json())
      .then((data) => setAiAvailable(Boolean(data.configured)))
      .catch(() => setAiAvailable(false));
  }, []);

  async function handleGenerate() {
    const input = getInput();

    if (!input.name?.trim()) {
      toast.error("Enter a product name first");
      return;
    }

    setGenerating(true);

    try {
      const res = await fetch("/api/admin/products/ai-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data?.error || "Could not generate content");
        return;
      }

      onGenerated(data);
      toast.success("Draft generated - review and edit before saving");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="rounded-2xl border border-dashed border-brand-300 bg-brand-50/50 p-4 dark:border-brand-800 dark:bg-brand-950/20">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-neutral-800 dark:text-neutral-100">
          <Sparkles className="h-4 w-4 text-brand-600" aria-hidden="true" />
          AI Product Content Generator
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={generating || aiAvailable === false}
          onClick={handleGenerate}
        >
          {generating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Generating...
            </>
          ) : (
            "Generate with AI"
          )}
        </Button>
      </div>

      {aiAvailable === false && (
        <p className="mt-2 text-xs text-neutral-500">
          No AI provider is configured (set OPENAI_API_KEY, ANTHROPIC_API_KEY, or GEMINI_API_KEY) - this
          tool is unavailable until one is set up.
        </p>
      )}

      <p className="mt-2 text-xs text-neutral-500">
        Drafts a short/detailed description, SEO title &amp; meta description, highlights, key benefits,
        ingredients, usage/storage instructions, and FAQs from the fields above. Review and edit everything
        below before saving.
      </p>
    </div>
  );
}
