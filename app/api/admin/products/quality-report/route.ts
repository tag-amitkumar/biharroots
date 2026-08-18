import { NextResponse } from "next/server";
import { getAdminSession } from "@/features/auth/service";
import * as productRepository from "@/features/products/repository";
import { checkProductQuality } from "@/features/products/qualityCheck";

export async function GET() {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const products = await productRepository.findProducts({});

  const reports = products.map((product) => ({
    productId: product.id,
    name: product.name,
    ...checkProductQuality(product),
  }));

  const summary = {
    totalProducts: reports.length,
    productsWithCriticalIssues: reports.filter((r) => r.issues.some((i) => i.severity === "critical")).length,
    productsWithAnyIssue: reports.filter((r) => r.issues.length > 0).length,
    averageScore:
      reports.length > 0
        ? Math.round(reports.reduce((sum, r) => sum + r.score, 0) / reports.length)
        : 100,
  };

  return NextResponse.json({ summary, reports });
}
