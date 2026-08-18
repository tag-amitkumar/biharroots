import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export function findProducts(
  where: Prisma.ProductWhereInput,
  orderBy?: Prisma.ProductOrderByWithRelationInput,
  skip?: number,
  take?: number
) {
  return prisma.product.findMany({ where, orderBy, skip, take });
}

export async function findDistinctCategories() {
  const rows = await prisma.product.findMany({
    where: { category: { not: "" } },
    distinct: ["category"],
    select: { category: true },
    orderBy: { category: "asc" },
  });

  return rows.map((row) => row.category);
}

export function findProductById(id: string) {
  return prisma.product.findUnique({
    where: { id },
    include: { variants: true },
  });
}

export function findProductsByIds(ids: string[]) {
  return prisma.product.findMany({
    where: { id: { in: ids } },
    include: { variants: true },
  });
}

export function countProducts() {
  return prisma.product.count();
}

export async function findDistinctBrands() {
  const rows = await prisma.product.findMany({
    where: { brand: { not: null } },
    distinct: ["brand"],
    select: { brand: true },
    orderBy: { brand: "asc" },
  });

  return rows.map((row) => row.brand).filter((brand): brand is string => !!brand);
}

export async function findDistinctCountries() {
  const rows = await prisma.product.findMany({
    where: { countryOfOrigin: { not: null } },
    distinct: ["countryOfOrigin"],
    select: { countryOfOrigin: true },
    orderBy: { countryOfOrigin: "asc" },
  });

  return rows.map((row) => row.countryOfOrigin).filter((c): c is string => !!c);
}

// All-time, catalog-wide sales volume per product - backs the "Best
// Selling"/"Popularity" sort options, which need real order data rather
// than a simple column on Product.
export function findSalesCounts() {
  return prisma.orderItem.groupBy({
    by: ["productId"],
    where: { productId: { not: null } },
    _sum: { quantity: true },
  });
}

export function createProduct(data: Prisma.ProductCreateInput) {
  return prisma.product.create({ data });
}

export function updateProduct(id: string, data: Prisma.ProductUpdateInput) {
  return prisma.product.update({ where: { id }, data });
}

export function deleteProduct(id: string) {
  return prisma.product.delete({ where: { id } });
}

type VariantInput = { label: string; price: number; stock: number };

export function replaceVariants(productId: string, variants: VariantInput[]) {
  return prisma.$transaction([
    prisma.productVariant.deleteMany({ where: { productId } }),
    ...(variants.length
      ? [
          prisma.productVariant.createMany({
            data: variants.map((variant) => ({
              productId,
              label: variant.label,
              price: Number(variant.price),
              stock: Number(variant.stock),
            })),
          }),
        ]
      : []),
  ]);
}
