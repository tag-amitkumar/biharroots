import { describe, it, expect } from "vitest";
import { parseNaturalLanguageQuery } from "@/features/products/nlpQuery";

describe("parseNaturalLanguageQuery", () => {
  it("extracts a price budget and leaves the remaining keyword as free text", () => {
    const result = parseNaturalLanguageQuery("snacks under 300");

    expect(result.maxPrice).toBe(300);
    expect(result.freeText).toBe("snacks");
  });

  it("strips filler words instead of treating them as a literal search term", () => {
    const result = parseNaturalLanguageQuery("show me something nice under 150 rupees");

    expect(result.maxPrice).toBe(150);
    expect(result.freeText).toBe("");
  });

  it("recognizes a dietary keyword and sets the matching attribute flag", () => {
    const result = parseNaturalLanguageQuery("organic mango");

    expect(result.organicCertified).toBe(true);
    expect(result.freeText).toBe("mango");
  });

  it("recognizes multiple dietary keywords in the same query", () => {
    const result = parseNaturalLanguageQuery("vegan gluten free cookies");

    expect(result.vegan).toBe(true);
    expect(result.glutenFree).toBe(true);
    expect(result.freeText).toBe("cookies");
  });

  it("matches a known brand and removes it from the free text", () => {
    const result = parseNaturalLanguageQuery("farm fresh tomatoes", ["Farm Fresh"]);

    expect(result.brand).toBe("Farm Fresh");
    expect(result.freeText).toBe("tomatoes");
  });

  it("maps a health-goal keyword to a real searchable hint", () => {
    const result = parseNaturalLanguageQuery("something for immunity");

    expect(result.freeText).toContain("immunity");
  });

  it("combines a budget, a dietary flag, and a free-text product term together", () => {
    const result = parseNaturalLanguageQuery("organic snacks under 200");

    expect(result.maxPrice).toBe(200);
    expect(result.organicCertified).toBe(true);
    expect(result.freeText).toBe("snacks");
  });

  it("leaves freeText as the whole (lowercased) query when nothing structured is found", () => {
    const result = parseNaturalLanguageQuery("mango");

    expect(result.freeText).toBe("mango");
    expect(result.maxPrice).toBeUndefined();
  });

  it("strips trailing punctuation instead of leaving it as a stray free-text token", () => {
    const result = parseNaturalLanguageQuery("do you have anything vegan?");

    expect(result.vegan).toBe(true);
    expect(result.freeText).toBe("");
  });
});
