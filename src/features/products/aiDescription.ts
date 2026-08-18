import { generateChatCompletion, parseJSONResponse } from "@/features/ai/service";

// Genuinely LLM-dependent - there is no rule-based substitute for drafting
// original marketing copy, so unlike the assistant/search/review-summary
// features this throws AIProviderNotConfiguredError straight through to
// the caller instead of silently falling back to a fake "generated"
// result. The admin explicitly clicked "Generate"; an honest error is the
// correct response when there's nothing real to generate with.

export type GeneratedProductContent = {
  shortDescription: string;
  detailedDescription: string;
  seoTitle: string;
  seoMetaDescription: string;
  highlights: string[];
  keyBenefits: string[];
  ingredients: string;
  usageInstructions: string;
  storageInstructions: string;
  faqs: { question: string; answer: string }[];
};

export type ProductContentInput = {
  name: string;
  category?: string;
  brand?: string;
  price?: number;
  existingDescription?: string;
  organicCertified?: boolean;
  vegan?: boolean;
  glutenFree?: boolean;
  sugarFree?: boolean;
  ecoFriendly?: boolean;
  countryOfOrigin?: string;
  weight?: string;
};

function buildPrompt(input: ProductContentInput): string {
  const attributes = [
    input.organicCertified && "organic certified",
    input.vegan && "vegan",
    input.glutenFree && "gluten-free",
    input.sugarFree && "sugar-free",
    input.ecoFriendly && "eco-friendly",
  ]
    .filter(Boolean)
    .join(", ");

  const facts = [
    `Product name: ${input.name}`,
    input.category && `Category: ${input.category}`,
    input.brand && `Brand: ${input.brand}`,
    input.price !== undefined && `Price: ₹${input.price}`,
    input.weight && `Weight/size: ${input.weight}`,
    input.countryOfOrigin && `Country of origin: ${input.countryOfOrigin}`,
    attributes && `Attributes: ${attributes}`,
    input.existingDescription && `Existing draft description: ${input.existingDescription}`,
  ]
    .filter(Boolean)
    .join("\n");

  return (
    'Respond with JSON only: {"shortDescription": string, "detailedDescription": string, ' +
    '"seoTitle": string, "seoMetaDescription": string, "highlights": string[], "keyBenefits": string[], ' +
    '"ingredients": string, "usageInstructions": string, "storageInstructions": string, ' +
    '"faqs": {"question": string, "answer": string}[]}.\n\n' +
    "Rules:\n" +
    "- shortDescription: 1-2 sentences, suitable for a product card.\n" +
    "- detailedDescription: 3-5 sentences, suitable for the full product page.\n" +
    "- seoTitle: under 60 characters.\n" +
    "- seoMetaDescription: under 160 characters.\n" +
    "- highlights: 3-5 short bullet phrases (quick facts/features).\n" +
    "- keyBenefits: 3-5 short bullet phrases (why it matters to the customer, distinct from highlights).\n" +
    "- ingredients: a short plain-text ingredients list appropriate for this kind of product; if not applicable " +
    "(e.g. a non-food/cosmetic item), return an empty string.\n" +
    "- usageInstructions / storageInstructions: 1-3 sentences each; if not applicable, return an empty string.\n" +
    "- faqs: 3 realistic shopper questions with concise answers.\n" +
    "- Base everything only on the facts given below - do not invent brand claims, certifications, or specific " +
    "numeric health claims not stated.\n\n" +
    `Facts:\n${facts}`
  );
}

export async function generateProductAIContent(
  input: ProductContentInput
): Promise<GeneratedProductContent> {
  const raw = await generateChatCompletion([
    {
      role: "system",
      content:
        "You are an e-commerce copywriter drafting original, accurate product content from the facts " +
        "you're given. Respond with JSON only, no prose or markdown fences.",
    },
    { role: "user", content: buildPrompt(input) },
  ]);

  const parsed = parseJSONResponse<Partial<GeneratedProductContent>>(raw);

  return {
    shortDescription: parsed.shortDescription ?? "",
    detailedDescription: parsed.detailedDescription ?? "",
    seoTitle: parsed.seoTitle ?? "",
    seoMetaDescription: parsed.seoMetaDescription ?? "",
    highlights: Array.isArray(parsed.highlights) ? parsed.highlights : [],
    keyBenefits: Array.isArray(parsed.keyBenefits) ? parsed.keyBenefits : [],
    ingredients: parsed.ingredients ?? "",
    usageInstructions: parsed.usageInstructions ?? "",
    storageInstructions: parsed.storageInstructions ?? "",
    faqs: Array.isArray(parsed.faqs) ? parsed.faqs : [],
  };
}
