import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/features/ai/service", () => ({
  generateChatCompletion: vi.fn(),
  parseJSONResponse: vi.fn(),
  isAIConfigured: vi.fn(() => false),
}));

import * as aiService from "@/features/ai/service";
import {
  generateSeoKeywords,
  generateProductTags,
  generateImageAltText,
  suggestCategories,
} from "@/features/products/adminTools";

beforeEach(() => {
  vi.mocked(aiService.generateChatCompletion).mockReset();
  vi.mocked(aiService.parseJSONResponse).mockReset();
  vi.mocked(aiService.isAIConfigured).mockReset().mockReturnValue(false);
});

describe("generateSeoKeywords", () => {
  it("extracts real keywords from the product's own text when no AI provider is configured", async () => {
    const result = await generateSeoKeywords({
      name: "Organic Almonds",
      description: "Fresh organic almonds from California",
      category: "Nuts",
    });

    expect(result.source).toBe("rule");
    expect(result.keywords).toContain("organic");
    expect(result.keywords).toContain("almonds");
    expect(aiService.generateChatCompletion).not.toHaveBeenCalled();
  });

  it("uses the AI provider's suggestions when configured", async () => {
    vi.mocked(aiService.isAIConfigured).mockReturnValue(true);
    vi.mocked(aiService.generateChatCompletion).mockResolvedValue('{"raw":true}');
    vi.mocked(aiService.parseJSONResponse).mockReturnValue({
      keywords: ["buy organic almonds online", "raw almonds"],
    });

    const result = await generateSeoKeywords({ name: "Organic Almonds" });

    expect(result.source).toBe("llm");
    expect(result.keywords).toEqual(["buy organic almonds online", "raw almonds"]);
  });

  it("falls back to the deterministic extractor when the AI provider errors", async () => {
    vi.mocked(aiService.isAIConfigured).mockReturnValue(true);
    vi.mocked(aiService.generateChatCompletion).mockRejectedValue(new Error("network down"));

    const result = await generateSeoKeywords({ name: "Organic Almonds", description: "healthy snack" });

    expect(result.source).toBe("rule");
    expect(result.keywords.length).toBeGreaterThan(0);
  });
});

describe("generateProductTags", () => {
  it("always includes real dietary attribute tags regardless of AI availability", async () => {
    const result = await generateProductTags({
      name: "Vegan Protein Bar",
      organicCertified: true,
      vegan: true,
    });

    expect(result.source).toBe("rule");
    expect(result.tags).toEqual(expect.arrayContaining(["organic", "vegan"]));
  });

  it("merges AI-suggested tags with real attribute tags rather than replacing them", async () => {
    vi.mocked(aiService.isAIConfigured).mockReturnValue(true);
    vi.mocked(aiService.generateChatCompletion).mockResolvedValue("{}");
    vi.mocked(aiService.parseJSONResponse).mockReturnValue({ tags: ["snack", "protein"] });

    const result = await generateProductTags({ name: "Vegan Protein Bar", vegan: true });

    expect(result.source).toBe("llm");
    expect(result.tags).toEqual(expect.arrayContaining(["vegan", "snack", "protein"]));
  });
});

describe("generateImageAltText", () => {
  it("builds an honest, data-driven fallback alt text without an AI provider", async () => {
    const result = await generateImageAltText({ name: "Organic Almonds", brand: "NatureCart", category: "Nuts" });

    expect(result.source).toBe("rule");
    expect(result.altText).toContain("Organic Almonds");
    expect(result.altText).toContain("NatureCart");
  });

  it("uses the AI-generated alt text when configured", async () => {
    vi.mocked(aiService.isAIConfigured).mockReturnValue(true);
    vi.mocked(aiService.generateChatCompletion).mockResolvedValue("{}");
    vi.mocked(aiService.parseJSONResponse).mockReturnValue({
      altText: "A glass jar of raw organic almonds on a wooden table",
    });

    const result = await generateImageAltText({ name: "Organic Almonds" });

    expect(result.source).toBe("llm");
    expect(result.altText).toBe("A glass jar of raw organic almonds on a wooden table");
  });
});

describe("suggestCategories", () => {
  const categories = [
    { id: "cat-nuts", name: "Nuts", description: "Almonds, cashews, and other tree nuts" },
    { id: "cat-dairy", name: "Dairy", description: "Milk, cheese, and yogurt" },
    { id: "cat-beverages", name: "Beverages", description: "Juices, teas, and soft drinks" },
  ];

  it("suggests the category with the strongest real keyword overlap", () => {
    const result = suggestCategories(
      { name: "Roasted Almonds", description: "A tasty pack of roasted tree nuts" },
      categories
    );

    expect(result[0].categoryId).toBe("cat-nuts");
  });

  it("returns no suggestions when nothing genuinely overlaps", () => {
    const result = suggestCategories({ name: "Bluetooth Speaker", description: "Portable audio device" }, categories);

    expect(result).toEqual([]);
  });
});
