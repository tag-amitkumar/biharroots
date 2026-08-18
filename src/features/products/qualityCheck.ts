// Real, deterministic product data-completeness checks - no LLM
// involved, since "does this product have a description/image/price
// filled in" is plain validation, not something that benefits from AI.

export type QualityIssue = {
  field: string;
  message: string;
  severity: "critical" | "recommended";
};

export type QualityReport = {
  issues: QualityIssue[];
  score: number;
};

export type ProductQualityInput = {
  name: string;
  description: string;
  image: string;
  price: number;
  category: string;
  stock: number;
  seoTitle?: string | null;
  seoMetaDescription?: string | null;
  imageAlt?: string | null;
  tags?: string;
  seoKeywords?: string;
};

const MIN_DESCRIPTION_LENGTH = 20;

function parseJsonArrayLength(json: string | undefined): number {
  try {
    const parsed = JSON.parse(json || "[]");
    return Array.isArray(parsed) ? parsed.length : 0;
  } catch {
    return 0;
  }
}

// The checks a shopper/search-engine would actually notice missing are
// "critical"; SEO/discoverability polish that doesn't break the page is
// "recommended" - both count toward the score, but callers can filter by
// severity to prioritize a punch list.
export function checkProductQuality(product: ProductQualityInput): QualityReport {
  const issues: QualityIssue[] = [];

  if (!product.name?.trim()) {
    issues.push({ field: "name", message: "Missing product name", severity: "critical" });
  }

  if (!product.description?.trim() || product.description.trim().length < MIN_DESCRIPTION_LENGTH) {
    issues.push({
      field: "description",
      message: `Description is missing or shorter than ${MIN_DESCRIPTION_LENGTH} characters`,
      severity: "critical",
    });
  }

  if (!product.image?.trim()) {
    issues.push({ field: "image", message: "Missing cover image", severity: "critical" });
  }

  if (!product.price || product.price <= 0) {
    issues.push({ field: "price", message: "Price is missing or invalid", severity: "critical" });
  }

  if (!product.category?.trim()) {
    issues.push({ field: "category", message: "Not assigned to a category", severity: "critical" });
  }

  if (!product.stock || product.stock <= 0) {
    issues.push({ field: "stock", message: "Out of stock", severity: "recommended" });
  }

  if (!product.seoTitle?.trim()) {
    issues.push({ field: "seoTitle", message: "Missing SEO title", severity: "recommended" });
  }

  if (!product.seoMetaDescription?.trim()) {
    issues.push({
      field: "seoMetaDescription",
      message: "Missing SEO meta description",
      severity: "recommended",
    });
  }

  if (!product.imageAlt?.trim()) {
    issues.push({ field: "imageAlt", message: "Missing image alt text", severity: "recommended" });
  }

  if (parseJsonArrayLength(product.tags) === 0) {
    issues.push({ field: "tags", message: "No tags assigned", severity: "recommended" });
  }

  if (parseJsonArrayLength(product.seoKeywords) === 0) {
    issues.push({ field: "seoKeywords", message: "No SEO keywords assigned", severity: "recommended" });
  }

  const totalChecks = 10;
  const score = Math.max(0, Math.round(((totalChecks - issues.length) / totalChecks) * 100));

  return { issues, score };
}
