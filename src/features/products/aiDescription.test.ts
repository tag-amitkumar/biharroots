import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/features/ai/service", () => ({
  generateChatCompletion: vi.fn(),
  parseJSONResponse: vi.fn(),
}));

import * as aiService from "@/features/ai/service";
import { generateProductAIContent } from "@/features/products/aiDescription";

beforeEach(() => {
  vi.mocked(aiService.generateChatCompletion).mockReset();
  vi.mocked(aiService.parseJSONResponse).mockReset();
});

describe("generateProductAIContent", () => {
  it("sends the product facts to the AI provider and returns the parsed content", async () => {
    vi.mocked(aiService.generateChatCompletion).mockResolvedValue('{"raw": "response"}');
    vi.mocked(aiService.parseJSONResponse).mockReturnValue({
      shortDescription: "Fresh organic almonds.",
      detailedDescription: "Sourced from California, these organic almonds are a great snack.",
      seoTitle: "Organic Almonds - NatureCart",
      seoMetaDescription: "Buy fresh organic almonds online.",
      highlights: ["Rich in protein", "No preservatives"],
      keyBenefits: ["Supports heart health"],
      ingredients: "100% almonds",
      usageInstructions: "Eat as a snack or add to meals.",
      storageInstructions: "Store in a cool, dry place.",
      faqs: [{ question: "Is this vegan?", answer: "Yes." }],
    });

    const result = await generateProductAIContent({ name: "Organic Almonds", category: "Nuts" });

    expect(result.shortDescription).toBe("Fresh organic almonds.");
    expect(result.highlights).toEqual(["Rich in protein", "No preservatives"]);
    expect(result.faqs).toEqual([{ question: "Is this vegan?", answer: "Yes." }]);

    const [messages] = vi.mocked(aiService.generateChatCompletion).mock.calls[0];
    expect(messages[1].content).toContain("Organic Almonds");
    expect(messages[1].content).toContain("Nuts");
  });

  it("includes dietary attributes and existing description in the prompt when given", async () => {
    vi.mocked(aiService.generateChatCompletion).mockResolvedValue("{}");
    vi.mocked(aiService.parseJSONResponse).mockReturnValue({});

    await generateProductAIContent({
      name: "Herbal Soap",
      organicCertified: true,
      ecoFriendly: true,
      existingDescription: "A gentle bar soap.",
    });

    const [messages] = vi.mocked(aiService.generateChatCompletion).mock.calls[0];
    expect(messages[1].content).toContain("organic certified");
    expect(messages[1].content).toContain("eco-friendly");
    expect(messages[1].content).toContain("A gentle bar soap.");
  });

  it("defaults every field to an honest empty value when the AI response omits them", async () => {
    vi.mocked(aiService.generateChatCompletion).mockResolvedValue("{}");
    vi.mocked(aiService.parseJSONResponse).mockReturnValue({});

    const result = await generateProductAIContent({ name: "Mystery Item" });

    expect(result).toEqual({
      shortDescription: "",
      detailedDescription: "",
      seoTitle: "",
      seoMetaDescription: "",
      highlights: [],
      keyBenefits: [],
      ingredients: "",
      usageInstructions: "",
      storageInstructions: "",
      faqs: [],
    });
  });

  it("propagates AIProviderNotConfiguredError to the caller instead of returning fake content", async () => {
    const { AIProviderNotConfiguredError } = await vi.importActual<typeof import("@/features/ai/errors")>(
      "@/features/ai/errors"
    );
    vi.mocked(aiService.generateChatCompletion).mockRejectedValue(new AIProviderNotConfiguredError());

    await expect(generateProductAIContent({ name: "Mystery Item" })).rejects.toThrow(
      AIProviderNotConfiguredError
    );
  });
});
