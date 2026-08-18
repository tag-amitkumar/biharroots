import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/features/ai/service", () => ({
  generateChatCompletion: vi.fn(),
  parseJSONResponse: vi.fn(),
}));

import * as aiService from "@/features/ai/service";
import {
  splitNutritionSpecs,
  parseIngredientsList,
  explainIngredients,
} from "@/features/nutrition/service";

beforeEach(() => {
  vi.mocked(aiService.generateChatCompletion).mockReset();
  vi.mocked(aiService.parseJSONResponse).mockReset();
});

describe("splitNutritionSpecs", () => {
  it("separates real nutrition-related keys from other specifications", () => {
    const result = splitNutritionSpecs(
      JSON.stringify({ Protein: "20g", Calories: "150 kcal", Origin: "India", "Shelf life": "7 days" })
    );

    expect(result.nutrition).toEqual([
      { key: "Protein", value: "20g" },
      { key: "Calories", value: "150 kcal" },
    ]);
    expect(result.other).toEqual([
      { key: "Origin", value: "India" },
      { key: "Shelf life", value: "7 days" },
    ]);
  });

  it("returns empty arrays for an empty or invalid specifications blob", () => {
    expect(splitNutritionSpecs("{}")).toEqual({ nutrition: [], other: [] });
    expect(splitNutritionSpecs("")).toEqual({ nutrition: [], other: [] });
    expect(splitNutritionSpecs("not json")).toEqual({ nutrition: [], other: [] });
  });

  it("matches nutrition keys case-insensitively", () => {
    const result = splitNutritionSpecs(JSON.stringify({ PROTEIN: "10g", sugar: "5g" }));

    expect(result.nutrition.map((entry) => entry.key)).toEqual(["PROTEIN", "sugar"]);
  });
});

describe("parseIngredientsList", () => {
  it("splits a comma-separated ingredients string into a trimmed list", () => {
    expect(parseIngredientsList("Almonds, Cashews , Sea Salt")).toEqual([
      "Almonds",
      "Cashews",
      "Sea Salt",
    ]);
  });

  it("returns an empty list for null, undefined, or blank input", () => {
    expect(parseIngredientsList(null)).toEqual([]);
    expect(parseIngredientsList(undefined)).toEqual([]);
    expect(parseIngredientsList("   ")).toEqual([]);
  });
});

describe("explainIngredients", () => {
  it("sends the ingredient list to the AI provider and returns the parsed explanations", async () => {
    vi.mocked(aiService.generateChatCompletion).mockResolvedValue('{"raw": true}');
    vi.mocked(aiService.parseJSONResponse).mockReturnValue({
      explanations: [{ ingredient: "Almonds", explanation: "A tree nut, high in protein and healthy fats." }],
    });

    const result = await explainIngredients(["Almonds"]);

    expect(result).toEqual([
      { ingredient: "Almonds", explanation: "A tree nut, high in protein and healthy fats." },
    ]);

    const [messages] = vi.mocked(aiService.generateChatCompletion).mock.calls[0];
    expect(messages[1].content).toContain("Almonds");
  });

  it("returns an empty list when the AI response doesn't include explanations", async () => {
    vi.mocked(aiService.generateChatCompletion).mockResolvedValue("{}");
    vi.mocked(aiService.parseJSONResponse).mockReturnValue({});

    const result = await explainIngredients(["Almonds"]);

    expect(result).toEqual([]);
  });

  it("propagates AIProviderNotConfiguredError instead of returning a fake explanation", async () => {
    const { AIProviderNotConfiguredError } = await vi.importActual<typeof import("@/features/ai/errors")>(
      "@/features/ai/errors"
    );
    vi.mocked(aiService.generateChatCompletion).mockRejectedValue(new AIProviderNotConfiguredError());

    await expect(explainIngredients(["Almonds"])).rejects.toThrow(AIProviderNotConfiguredError);
  });
});
