import * as productRepository from "@/features/products/repository";
import * as recommendationsService from "@/features/recommendations/service";
import * as categoryService from "@/features/categories/service";
import * as filtering from "@/features/products/filtering";

export type { ProductSort, ProductFilterInput } from "@/features/products/filtering";

export function listProducts(input: filtering.ProductFilterInput) {
  return filtering.findFilteredProducts(input);
}

export function listCategories() {
  return productRepository.findDistinctCategories();
}

export function listBrands() {
  return productRepository.findDistinctBrands();
}

export function listCountriesOfOrigin() {
  return productRepository.findDistinctCountries();
}

export async function getProduct(id: string) {
  const product = await productRepository.findProductById(id);

  if (!product) return null;

  const categoryIds = await categoryService.getCategoriesForProduct(id);

  return { ...product, categoryIds };
}

export function getProductsByIds(ids: string[]) {
  return productRepository.findProductsByIds(ids);
}

// Delegates to the multi-factor recommendation engine (category + price
// proximity + rating) rather than the old "first 4 rows in this category"
// query - same signature/behavior contract every existing caller relies on.
export function getRelatedProducts(productId: string) {
  return recommendationsService.getSimilarProducts(productId);
}

export function countProducts() {
  return productRepository.countProducts();
}

// Turns admin-entered "Key: Value" lines into a JSON spec sheet, e.g.
// "Origin: India\nShelf life: 7 days" -> {"Origin":"India","Shelf life":"7 days"}
export function parseSpecifications(raw: string): string {
  const spec: Record<string, string> = {};

  raw.split("\n").forEach((line) => {
    const separatorIndex = line.indexOf(":");
    if (separatorIndex === -1) return;

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();

    if (key && value) {
      spec[key] = value;
    }
  });

  return JSON.stringify(spec);
}

// Turns admin-entered "Q: .../A: ..." blocks (blank-line separated) into
// a structured FAQ list, e.g. "Q: Is this vegan?\nA: Yes." ->
// [{question: "Is this vegan?", answer: "Yes."}]
export function parseFAQText(raw: string): { question: string; answer: string }[] {
  return raw
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      // [ \t]*, not \s* - \s would match the newline too and let the
      // capture group bleed into the next line's content.
      const question = block.match(/^Q:[ \t]*(.*)$/im)?.[1]?.trim() ?? "";
      const answer = block.match(/^A:[ \t]*(.*)$/im)?.[1]?.trim() ?? "";

      return { question, answer };
    })
    .filter((faq) => faq.question || faq.answer);
}

export function serializeFAQs(faqs: { question: string; answer: string }[]): string {
  return faqs.map((faq) => `Q: ${faq.question}\nA: ${faq.answer}`).join("\n\n");
}

type VariantInput = { label: string; price: number | string; stock: number | string };

type ProductInput = {
  name: string;
  description: string;
  price: number | string;
  image: string;
  category: string;
  stock: number | string;
  images?: string;
  specificationsText?: string;
  variants?: VariantInput[];
  categoryIds?: string[];
  featured?: boolean;
  brand?: string;
  mrp?: number | string | null;
  organicCertified?: boolean;
  vegan?: boolean;
  glutenFree?: boolean;
  sugarFree?: boolean;
  ecoFriendly?: boolean;
  countryOfOrigin?: string;
  weight?: string;
  seoTitle?: string;
  seoMetaDescription?: string;
  detailedDescription?: string;
  highlightsText?: string;
  keyBenefitsText?: string;
  ingredients?: string;
  usageInstructions?: string;
  storageInstructions?: string;
  faqsText?: string;
  seoKeywordsText?: string;
  tagsText?: string;
  imageAlt?: string;
};

function attributeFields(input: ProductInput) {
  return {
    featured: Boolean(input.featured),
    brand: input.brand || null,
    mrp: input.mrp !== undefined && input.mrp !== null && input.mrp !== "" ? Number(input.mrp) : null,
    organicCertified: Boolean(input.organicCertified),
    vegan: Boolean(input.vegan),
    glutenFree: Boolean(input.glutenFree),
    sugarFree: Boolean(input.sugarFree),
    ecoFriendly: Boolean(input.ecoFriendly),
    countryOfOrigin: input.countryOfOrigin || null,
    weight: input.weight || null,
    seoTitle: input.seoTitle || null,
    seoMetaDescription: input.seoMetaDescription || null,
    detailedDescription: input.detailedDescription || null,
    highlights: JSON.stringify(
      (input.highlightsText || "")
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
    ),
    keyBenefits: JSON.stringify(
      (input.keyBenefitsText || "")
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
    ),
    ingredients: input.ingredients || null,
    usageInstructions: input.usageInstructions || null,
    storageInstructions: input.storageInstructions || null,
    faqs: JSON.stringify(parseFAQText(input.faqsText || "")),
    seoKeywords: JSON.stringify(
      (input.seoKeywordsText || "")
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
    ),
    tags: JSON.stringify(
      (input.tagsText || "")
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
    ),
    imageAlt: input.imageAlt || null,
  };
}

export async function createProduct(input: ProductInput) {
  const product = await productRepository.createProduct({
    name: input.name,
    description: input.description,
    price: Number(input.price),
    image: input.image,
    category: input.category,
    stock: Number(input.stock),
    images: input.images || "",
    specifications: parseSpecifications(input.specificationsText || ""),
    ...attributeFields(input),
  });

  if (input.variants?.length) {
    await productRepository.replaceVariants(
      product.id,
      input.variants.map((variant) => ({
        label: variant.label,
        price: Number(variant.price),
        stock: Number(variant.stock),
      }))
    );
  }

  if (input.categoryIds) {
    await categoryService.assignCategoriesToProduct(product.id, input.categoryIds);
  }

  return product;
}

export async function updateProduct(id: string, input: ProductInput) {
  const product = await productRepository.updateProduct(id, {
    name: input.name,
    description: input.description,
    price: Number(input.price),
    image: input.image,
    category: input.category,
    stock: Number(input.stock),
    images: input.images || "",
    specifications: parseSpecifications(input.specificationsText || ""),
    ...attributeFields(input),
  });

  await productRepository.replaceVariants(
    id,
    (input.variants || []).map((variant) => ({
      label: variant.label,
      price: Number(variant.price),
      stock: Number(variant.stock),
    }))
  );

  if (input.categoryIds) {
    await categoryService.assignCategoriesToProduct(id, input.categoryIds);
  }

  return product;
}

export function deleteProduct(id: string) {
  return productRepository.deleteProduct(id);
}
