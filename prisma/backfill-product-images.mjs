// One-off backfill for products created before gallery/alt-text image
// generation existed in seed-products.mjs. Safe to re-run: only touches
// `image` when it's still a placehold.co placeholder (or empty), and only
// fills `images`/`imageAlt` when they're currently empty - never
// overwrites a real image an admin has already uploaded/set.
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Same organic-toned palette used for category banners in
// seed-categories.mjs, for a consistent visual language site-wide.
const COLOR_PALETTE = [
  ["dcedc8", "33691e"], ["fff3c4", "8d6e00"], ["d7ccc8", "4e342e"],
  ["ffe0b2", "8d5524"], ["c8e6c9", "1b5e20"], ["ffccbc", "bf360c"],
  ["fff9c4", "9e7500"], ["ffe6a7", "8a5a00"], ["e1f5fe", "01579b"],
  ["f1f8e9", "33691e"], ["fff8e1", "6d4c00"], ["e8f5e9", "1b5e20"],
  ["fce4ec", "880e4f"], ["e0f2f1", "004d40"], ["ede7f6", "4527a0"],
];

function colorFor(category) {
  let hash = 0;
  for (const char of category) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return COLOR_PALETTE[hash % COLOR_PALETTE.length];
}

function placeholderImage(name, bg, fg) {
  return `https://placehold.co/600x600/${bg}/${fg}.png?text=${encodeURIComponent(name)}`;
}

function placeholderGalleryImages(name, bg, fg) {
  return [
    `https://placehold.co/600x600/${bg}/${fg}.png?text=${encodeURIComponent(`${name} - Packaging`)}`,
    `https://placehold.co/600x600/${bg}/${fg}.png?text=${encodeURIComponent(`${name} - Alternate View`)}`,
  ].join("\n");
}

function imageAltText(product) {
  return [product.brand, product.name, product.category ? `- ${product.category}` : ""]
    .filter(Boolean)
    .join(" ")
    .trim();
}

function isPlaceholderOrEmpty(image) {
  return !image?.trim() || image.includes("placehold.co");
}

const products = await prisma.product.findMany();

let imageUpdated = 0;
let galleryFilled = 0;
let altFilled = 0;

for (const product of products) {
  const [bg, fg] = colorFor(product.category || product.name);
  const data = {};

  if (isPlaceholderOrEmpty(product.image)) {
    data.image = placeholderImage(product.name, bg, fg);
    imageUpdated++;
  }

  if (!product.images?.trim()) {
    data.images = placeholderGalleryImages(product.name, bg, fg);
    galleryFilled++;
  }

  if (!product.imageAlt?.trim()) {
    data.imageAlt = imageAltText(product);
    altFilled++;
  }

  if (Object.keys(data).length > 0) {
    await prisma.product.update({ where: { id: product.id }, data });
  }
}

console.log(
  `Backfilled ${products.length} products: ${imageUpdated} cover images reformatted/filled, ` +
    `${galleryFilled} galleries filled, ${altFilled} alt texts filled.`
);
await prisma.$disconnect();
