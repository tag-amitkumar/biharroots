import { generateChatCompletion, parseJSONResponse } from "@/features/ai/service";

// Keys treated as "nutritional insight" data when found in a product's
// free-form specifications sheet - a case-insensitive substring match
// against real admin-entered spec keys, not a fixed schema, since
// `specifications` is a free-text JSON blob (see products/service.ts's
// parseSpecifications). Deterministic, no LLM: only ever surfaces real
// data the admin actually entered.
const NUTRITION_KEY_PATTERNS = [
  "protein",
  "calorie",
  "energy",
  "fat",
  "carb",
  "fiber",
  "fibre",
  "sugar",
  "sodium",
  "calcium",
  "iron",
  "vitamin",
  "cholesterol",
];

export type NutritionEntry = { key: string; value: string };

// Splits a product's specifications into { nutrition, other } so a
// product page can show a dedicated "Nutrition Facts" panel without
// duplicating those same rows in the generic Specifications table.
export function splitNutritionSpecs(specifications: string): {
  nutrition: NutritionEntry[];
  other: NutritionEntry[];
} {
  let parsed: Record<string, string> = {};

  try {
    parsed = JSON.parse(specifications || "{}");
  } catch {
    parsed = {};
  }

  const nutrition: NutritionEntry[] = [];
  const other: NutritionEntry[] = [];

  for (const [key, value] of Object.entries(parsed)) {
    const target = NUTRITION_KEY_PATTERNS.some((pattern) => key.toLowerCase().includes(pattern))
      ? nutrition
      : other;

    target.push({ key, value });
  }

  return { nutrition, other };
}

// Real ingredient list, split from the admin-entered `ingredients` field
// (comma-separated) - no LLM involved, and empty when the field is empty
// rather than inventing placeholder ingredients.
export function parseIngredientsList(ingredients: string | null | undefined): string[] {
  if (!ingredients?.trim()) return [];

  return ingredients
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export type IngredientExplanation = { ingredient: string; explanation: string };

// Genuinely LLM-dependent (explaining what an ingredient is/why it's used
// requires real-world knowledge no rule-based logic here has), so - like
// the AI Product Description Generator - this propagates
// AIProviderNotConfiguredError to the caller instead of faking an
// explanation. Triggered by an explicit shopper action ("Explain in
// simple terms"), not automatically on every page view, so there's no
// silent per-pageview LLM cost.
export async function explainIngredients(ingredients: string[]): Promise<IngredientExplanation[]> {
  const raw = await generateChatCompletion([
    {
      role: "system",
      content:
        "You explain food/cosmetic ingredients in simple, plain language for a general shopper. " +
        "Respond with JSON only, no prose or markdown fences.",
    },
    {
      role: "user",
      content:
        'Respond with JSON only: {"explanations": {"ingredient": string, "explanation": string}[]}. ' +
        "For each ingredient listed below, give one short, plain-language sentence explaining what it is " +
        "and/or why it's commonly used. Do not invent health claims - stick to general, widely-known facts.\n\n" +
        `Ingredients:\n${ingredients.join(", ")}`,
    },
  ]);

  const parsed = parseJSONResponse<{ explanations?: IngredientExplanation[] }>(raw);

  return Array.isArray(parsed.explanations) ? parsed.explanations : [];
}
