// Rule-based natural-language query parsing - no LLM involved. Extracts
// structured signals (price, dietary attributes, brand) a shopper typed in
// plain English ("organic snacks under 300 from Farm Fresh"), leaving
// whatever's left as free text for fuzzy product matching. Shared by the
// smart search engine (products/filtering.ts) and the AI shopping
// assistant, so both understand the same phrasing identically.

export type ParsedQuery = {
  maxPrice?: number;
  organicCertified?: boolean;
  vegan?: boolean;
  glutenFree?: boolean;
  sugarFree?: boolean;
  ecoFriendly?: boolean;
  brand?: string;
  freeText: string;
};

export const DIETARY_KEYWORDS: {
  pattern: RegExp;
  field: "organicCertified" | "vegan" | "glutenFree" | "sugarFree" | "ecoFriendly";
  label: string;
}[] = [
  { pattern: /\borganic\b/, field: "organicCertified", label: "organic" },
  { pattern: /\bvegan\b/, field: "vegan", label: "vegan" },
  { pattern: /\bgluten.?free\b/, field: "glutenFree", label: "gluten-free" },
  { pattern: /\bsugar.?free\b/, field: "sugarFree", label: "sugar-free" },
  { pattern: /\beco.?friendly\b/, field: "ecoFriendly", label: "eco-friendly" },
];

// A "health goal" hints at a category rather than a literal product name -
// mapped to a real search term that matches actual category/product
// content in the catalog (e.g. the Wellness > Protein subcategory),
// rather than a fabricated recommendation.
const HEALTH_GOAL_HINTS: { pattern: RegExp; hint: string }[] = [
  { pattern: /\bprotein\b/, hint: "protein" },
  { pattern: /\bimmunity\b/, hint: "immunity" },
  { pattern: /\benergy\b/, hint: "energy" },
  { pattern: /\bdigestion\b/, hint: "ayurvedic" },
  { pattern: /\bdetox\b/, hint: "herbal" },
];

const FILLER_WORDS = new Set([
  "show", "me", "something", "some", "any", "anything", "please", "i",
  "want", "need", "looking", "for", "do", "you", "have", "got", "a",
  "an", "the", "find", "get", "rupees", "rupee", "bucks", "products",
  "product", "items", "item", "good", "nice", "great", "with",
]);

function extractBudget(text: string): { maxPrice: number; matched: string } | null {
  const match = text.match(/(?:under|below|less than|within|budget of|up to)\s*(?:rs\.?|inr|₹)?\s*(\d+)/i)
    ?? text.match(/₹\s*(\d+)/);

  if (!match) return null;

  return { maxPrice: Number(match[1]), matched: match[0] };
}

export function parseNaturalLanguageQuery(raw: string, knownBrands: string[] = []): ParsedQuery {
  const text = raw.toLowerCase();
  let remainder = text;

  const result: ParsedQuery = { freeText: "" };

  const budget = extractBudget(text);
  if (budget) {
    result.maxPrice = budget.maxPrice;
    remainder = remainder.replace(budget.matched, "");
  }

  remainder = remainder
    .replace(/\b(under|below|less than|within|budget of|up to|rs|inr)\b/gi, "")
    .replace(/[₹]/g, "");

  for (const dietary of DIETARY_KEYWORDS) {
    if (dietary.pattern.test(remainder)) {
      result[dietary.field] = true;
      remainder = remainder.replace(dietary.pattern, "");
    }
  }

  for (const brand of knownBrands) {
    if (remainder.includes(brand.toLowerCase())) {
      result.brand = brand;
      remainder = remainder.replace(new RegExp(brand, "gi"), "");
      break;
    }
  }

  const healthGoalHints: string[] = [];
  for (const goal of HEALTH_GOAL_HINTS) {
    if (goal.pattern.test(remainder)) {
      healthGoalHints.push(goal.hint);
      remainder = remainder.replace(goal.pattern, "");
    }
  }

  const cleaned = remainder
    .replace(/[?!.,;:]+/g, " ")
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word && !FILLER_WORDS.has(word))
    .join(" ")
    .trim();

  result.freeText = [cleaned, ...healthGoalHints].filter(Boolean).join(" ").trim();

  return result;
}
