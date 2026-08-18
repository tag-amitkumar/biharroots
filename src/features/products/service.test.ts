import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/features/products/repository", () => ({
  findProducts: vi.fn(() => []),
  createProduct: vi.fn((data) => ({ id: "prod-1", ...data })),
  updateProduct: vi.fn((id, data) => ({ id, ...data })),
  replaceVariants: vi.fn(),
}));

vi.mock("@/features/categories/service", () => ({
  assignCategoriesToProduct: vi.fn(),
}));

import * as productRepository from "@/features/products/repository";
import * as categoryService from "@/features/categories/service";
import {
  listProducts,
  createProduct,
  updateProduct,
  parseFAQText,
  serializeFAQs,
} from "@/features/products/service";

beforeEach(() => {
  vi.mocked(productRepository.findProducts).mockClear();
  vi.mocked(productRepository.createProduct).mockClear();
  vi.mocked(productRepository.updateProduct).mockClear();
  vi.mocked(categoryService.assignCategoriesToProduct).mockClear();
});

describe("listProducts", () => {
  it("omits skip/take when no page/pageSize is given, preserving the original return-everything behavior", () => {
    listProducts({});

    expect(productRepository.findProducts).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      undefined,
      undefined
    );
  });

  it("computes skip from page/pageSize for page 1", () => {
    listProducts({ page: 1, pageSize: 12 });

    expect(productRepository.findProducts).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      0,
      12
    );
  });

  it("computes skip from page/pageSize for page 3", () => {
    listProducts({ page: 3, pageSize: 12 });

    expect(productRepository.findProducts).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      24,
      12
    );
  });
});

const BASE_PRODUCT_INPUT = {
  name: "Organic Avocado",
  description: "",
  price: 40,
  image: "",
  category: "",
  stock: 10,
};

describe("createProduct", () => {
  it("assigns categories when categoryIds is provided", async () => {
    await createProduct({ ...BASE_PRODUCT_INPUT, categoryIds: ["cat-1", "cat-2"] });

    expect(categoryService.assignCategoriesToProduct).toHaveBeenCalledWith("prod-1", [
      "cat-1",
      "cat-2",
    ]);
  });

  it("does not touch category assignment when categoryIds is omitted", async () => {
    await createProduct(BASE_PRODUCT_INPUT);

    expect(categoryService.assignCategoriesToProduct).not.toHaveBeenCalled();
  });
});

describe("updateProduct", () => {
  it("re-assigns categories when categoryIds is provided", async () => {
    await updateProduct("prod-1", { ...BASE_PRODUCT_INPUT, categoryIds: ["cat-3"] });

    expect(categoryService.assignCategoriesToProduct).toHaveBeenCalledWith("prod-1", ["cat-3"]);
  });

  it("leaves existing category assignments untouched when categoryIds is omitted", async () => {
    await updateProduct("prod-1", BASE_PRODUCT_INPUT);

    expect(categoryService.assignCategoriesToProduct).not.toHaveBeenCalled();
  });

  it("persists the AI-generated content fields when provided", async () => {
    await updateProduct("prod-1", {
      ...BASE_PRODUCT_INPUT,
      seoTitle: "Great Avocado",
      seoMetaDescription: "Buy avocados online",
      detailedDescription: "A creamy, nutrient-dense fruit.",
      highlightsText: "Rich in healthy fats\nGreat for salads",
      keyBenefitsText: "Supports heart health",
      ingredients: "100% avocado",
      usageInstructions: "Slice and serve",
      storageInstructions: "Refrigerate after ripening",
      faqsText: "Q: Is this organic?\nA: Yes.",
    });

    expect(productRepository.updateProduct).toHaveBeenCalledWith(
      "prod-1",
      expect.objectContaining({
        seoTitle: "Great Avocado",
        seoMetaDescription: "Buy avocados online",
        detailedDescription: "A creamy, nutrient-dense fruit.",
        highlights: JSON.stringify(["Rich in healthy fats", "Great for salads"]),
        keyBenefits: JSON.stringify(["Supports heart health"]),
        ingredients: "100% avocado",
        usageInstructions: "Slice and serve",
        storageInstructions: "Refrigerate after ripening",
        faqs: JSON.stringify([{ question: "Is this organic?", answer: "Yes." }]),
      })
    );
  });

  it("defaults the AI-generated content fields to empty when omitted", async () => {
    await updateProduct("prod-1", BASE_PRODUCT_INPUT);

    expect(productRepository.updateProduct).toHaveBeenCalledWith(
      "prod-1",
      expect.objectContaining({
        seoTitle: null,
        seoMetaDescription: null,
        detailedDescription: null,
        highlights: "[]",
        keyBenefits: "[]",
        ingredients: null,
        usageInstructions: null,
        storageInstructions: null,
        faqs: "[]",
      })
    );
  });
});

describe("parseFAQText", () => {
  it("parses Q:/A: blocks separated by a blank line", () => {
    const result = parseFAQText("Q: Is this vegan?\nA: Yes.\n\nQ: Is this organic?\nA: Yes, certified.");

    expect(result).toEqual([
      { question: "Is this vegan?", answer: "Yes." },
      { question: "Is this organic?", answer: "Yes, certified." },
    ]);
  });

  it("returns an empty array for blank input", () => {
    expect(parseFAQText("")).toEqual([]);
  });

  it("ignores blocks missing both a question and an answer", () => {
    expect(parseFAQText("Q: \nA: \n\nQ: Real question?\nA: Real answer.")).toEqual([
      { question: "Real question?", answer: "Real answer." },
    ]);
  });
});

describe("serializeFAQs", () => {
  it("round-trips through parseFAQText", () => {
    const faqs = [
      { question: "Is this vegan?", answer: "Yes." },
      { question: "Is this organic?", answer: "Yes, certified." },
    ];

    expect(parseFAQText(serializeFAQs(faqs))).toEqual(faqs);
  });
});
