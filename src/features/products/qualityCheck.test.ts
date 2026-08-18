import { describe, it, expect } from "vitest";
import { checkProductQuality, ProductQualityInput } from "@/features/products/qualityCheck";

function completeProduct(overrides: Partial<ProductQualityInput> = {}): ProductQualityInput {
  return {
    name: "Organic Almonds",
    description: "A generous 500g pack of hand-picked, sun-dried organic almonds.",
    image: "https://example.com/almonds.jpg",
    price: 400,
    category: "Nuts",
    stock: 20,
    seoTitle: "Organic Almonds - NatureCart",
    seoMetaDescription: "Buy fresh organic almonds online.",
    imageAlt: "A bowl of organic almonds",
    tags: JSON.stringify(["nuts", "organic"]),
    seoKeywords: JSON.stringify(["organic almonds", "buy almonds online"]),
    ...overrides,
  };
}

describe("checkProductQuality", () => {
  it("reports a perfect score and no issues for a fully complete product", () => {
    const result = checkProductQuality(completeProduct());

    expect(result.issues).toEqual([]);
    expect(result.score).toBe(100);
  });

  it("flags a missing description as critical", () => {
    const result = checkProductQuality(completeProduct({ description: "" }));

    expect(result.issues).toContainEqual(
      expect.objectContaining({ field: "description", severity: "critical" })
    );
  });

  it("flags a description shorter than the minimum length as critical", () => {
    const result = checkProductQuality(completeProduct({ description: "Too short" }));

    expect(result.issues).toContainEqual(
      expect.objectContaining({ field: "description", severity: "critical" })
    );
  });

  it("flags a missing image, price, and category as critical", () => {
    const result = checkProductQuality(completeProduct({ image: "", price: 0, category: "" }));

    const criticalFields = result.issues.filter((i) => i.severity === "critical").map((i) => i.field);
    expect(criticalFields).toEqual(expect.arrayContaining(["image", "price", "category"]));
  });

  it("flags missing SEO fields, tags, keywords, and alt text as recommended (not critical)", () => {
    const result = checkProductQuality(
      completeProduct({ seoTitle: null, seoMetaDescription: null, imageAlt: null, tags: "[]", seoKeywords: "[]" })
    );

    const recommendedFields = result.issues.map((i) => i.field);
    expect(recommendedFields).toEqual(
      expect.arrayContaining(["seoTitle", "seoMetaDescription", "imageAlt", "tags", "seoKeywords"])
    );
    expect(result.issues.every((i) => i.severity === "recommended")).toBe(true);
  });

  it("flags out-of-stock as a recommended (not critical) issue", () => {
    const result = checkProductQuality(completeProduct({ stock: 0 }));

    expect(result.issues).toContainEqual(expect.objectContaining({ field: "stock", severity: "recommended" }));
  });

  it("lowers the score proportionally to the number of issues found", () => {
    const oneIssue = checkProductQuality(completeProduct({ imageAlt: null }));
    const threeIssues = checkProductQuality(
      completeProduct({ imageAlt: null, tags: "[]", seoKeywords: "[]" })
    );

    expect(oneIssue.score).toBeGreaterThan(threeIssues.score);
  });
});
