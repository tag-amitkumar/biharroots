import { generateChatCompletion, parseJSONResponse, isAIConfigured } from "@/features/ai/service";

// Every generator here follows the same honest pattern as AI Review
// Summary: try the AI provider when configured, but always fall back to
// a real, deterministic result (never a fabricated one) on any failure
// or when unconfigured - `source: "rule" | "llm"` tells the caller which
// happened. Unlike the AI Product Description Generator (which has no
// honest non-LLM substitute for drafting original marketing copy), a
// genuine deterministic keyword/tag/alt-text fallback exists here, so
// silently falling back - rather than throwing - is the honest choice.

const STOPWORDS = new Set([
  "the", "a", "an", "is", "was", "are", "were", "it", "its", "this", "that",
  "these", "those", "and", "or", "but", "of", "to", "in", "on", "for",
  "with", "as", "at", "by", "from", "premium", "pick", "range", "product",
  "products", "item", "items",
]);

function extractKeywords(text: string, limit: number): string[] {
  const counts = new Map<string, number>();

  text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .forEach((word) => {
      if (word.length > 2 && !STOPWORDS.has(word)) {
        counts.set(word, (counts.get(word) ?? 0) + 1);
      }
    });

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word]) => word);
}

export type ProductToolInput = {
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

function attributeTags(input: ProductToolInput): string[] {
  return [
    input.organicCertified && "organic",
    input.vegan && "vegan",
    input.glutenFree && "gluten-free",
    input.sugarFree && "sugar-free",
    input.ecoFriendly && "eco-friendly",
  ].filter((tag): tag is string => Boolean(tag));
}

function productText(input: ProductToolInput): string {
  return [input.name, input.description, input.category, input.brand].filter(Boolean).join(" ");
}

export type ToolResult<T> = { source: "rule" | "llm" } & T;

export async function generateSeoKeywords(input: ProductToolInput): Promise<ToolResult<{ keywords: string[] }>> {
  if (isAIConfigured()) {
    try {
      const raw = await generateChatCompletion([
        {
          role: "system",
          content:
            "You suggest SEO search keywords for an e-commerce product. Respond with JSON only, no prose or markdown fences.",
        },
        {
          role: "user",
          content:
            'Respond with JSON only: {"keywords": string[]}. Suggest 6-10 realistic search keywords/phrases ' +
            `a shopper might type to find this product.\n\n${productText(input)}`,
        },
      ]);

      const parsed = parseJSONResponse<{ keywords?: string[] }>(raw);

      if (Array.isArray(parsed.keywords) && parsed.keywords.length > 0) {
        return { keywords: parsed.keywords, source: "llm" };
      }
    } catch {
      // Fall through to the deterministic keyword extractor below.
    }
  }

  return { keywords: extractKeywords(productText(input), 8), source: "rule" };
}

export async function generateProductTags(input: ProductToolInput): Promise<ToolResult<{ tags: string[] }>> {
  const attrTags = attributeTags(input);

  if (isAIConfigured()) {
    try {
      const raw = await generateChatCompletion([
        {
          role: "system",
          content:
            "You suggest short browsing/filter tags for an e-commerce product. Respond with JSON only, no prose or markdown fences.",
        },
        {
          role: "user",
          content:
            'Respond with JSON only: {"tags": string[]}. Suggest 4-8 short (1-2 word) tags for browsing/filtering.' +
            `\n\n${productText(input)}`,
        },
      ]);

      const parsed = parseJSONResponse<{ tags?: string[] }>(raw);

      if (Array.isArray(parsed.tags) && parsed.tags.length > 0) {
        return { tags: [...new Set([...attrTags, ...parsed.tags])], source: "llm" };
      }
    } catch {
      // Fall through to the deterministic tag extractor below.
    }
  }

  return {
    tags: [...new Set([...attrTags, ...extractKeywords(productText(input), 5)])],
    source: "rule",
  };
}

export async function generateImageAltText(input: ProductToolInput): Promise<ToolResult<{ altText: string }>> {
  // Honest fallback: a real, SEO-reasonable description built from actual
  // product data - not a claim to have visually described the photo.
  const fallback = [input.brand, input.name, input.category ? `- ${input.category}` : ""]
    .filter(Boolean)
    .join(" ")
    .trim();

  if (isAIConfigured()) {
    try {
      const raw = await generateChatCompletion([
        {
          role: "system",
          content:
            "You write concise, accessible image alt text for e-commerce product photos. Respond with JSON only, no prose or markdown fences.",
        },
        {
          role: "user",
          content:
            'Respond with JSON only: {"altText": string}. Write alt text under 125 characters describing what the ' +
            `product photo most likely shows, based only on these product facts (don't invent visual details you ` +
            `can't know from the facts alone - describe the product itself).\n\n${productText(input)}`,
        },
      ]);

      const parsed = parseJSONResponse<{ altText?: string }>(raw);

      if (parsed.altText?.trim()) {
        return { altText: parsed.altText.trim(), source: "llm" };
      }
    } catch {
      // Fall through to the deterministic template fallback below.
    }
  }

  return { altText: fallback || input.name, source: "rule" };
}

export type CategorySuggestion = { categoryId: string; categoryName: string; score: number };

// Deterministic, no LLM: real keyword overlap between the product's own
// text and each existing category's name/description - a category name
// match counts double since it's the strongest real signal. Only
// suggests categories with a genuine, nonzero overlap.
export function suggestCategories(
  input: { name: string; description?: string },
  categories: { id: string; name: string; description?: string }[],
  limit = 3
): CategorySuggestion[] {
  const productWords = new Set(extractKeywords(`${input.name} ${input.description ?? ""}`, 30));

  return categories
    .map((category) => {
      const categoryWords = extractKeywords(`${category.name} ${category.description ?? ""}`, 30);
      const overlap = categoryWords.filter((word) => productWords.has(word)).length;
      const nameOverlap = category.name
        .toLowerCase()
        .split(/\s+/)
        .filter((word) => productWords.has(word)).length;

      return { categoryId: category.id, categoryName: category.name, score: overlap + nameOverlap * 2 };
    })
    .filter((suggestion) => suggestion.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
