import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// PNG (not the placehold.co default of SVG) so the browser never hits
// Next's SVG-optimizer restriction.
function placeholderImage(name, bg, fg) {
  return `https://placehold.co/600x600/${bg}/${fg}.png?text=${encodeURIComponent(name)}`;
}

// A couple of extra placeholder variants so the product detail page's
// existing gallery + zoom UI (already built, previously never fed any
// data) has real thumbnails to show.
function placeholderGalleryImages(name, bg, fg) {
  return [
    `https://placehold.co/600x600/${bg}/${fg}.png?text=${encodeURIComponent(`${name} - Packaging`)}`,
    `https://placehold.co/600x600/${bg}/${fg}.png?text=${encodeURIComponent(`${name} - Alternate View`)}`,
  ].join("\n");
}

// Same honest, data-driven template as adminTools.ts's generateImageAltText
// deterministic fallback - real product facts, not a claim to visually
// describe a photo.
function imageAltText(item, subName) {
  return [item.brand, item.name, subName ? `- ${subName}` : ""].filter(Boolean).join(" ").trim();
}

// Mirrors the exact category/subcategory names and order from
// seed-categories.mjs, with 2 realistic products attached to every
// subcategory - so every category page's Featured/New Arrivals/Best
// Sellers/Trending sections (and the "Shop All" grid) has real content
// instead of being empty.
const CATEGORIES = [
  {
    name: "Grains, Rice & Flour",
    bg: "fff8e1",
    fg: "8d6e00",
    subcategories: {
      Rice: [
        { name: "Premium Basmati Rice", price: 320, weight: "5kg", brand: "NatureCart Farms", countryOfOrigin: "India" },
        { name: "Organic Brown Rice", price: 210, weight: "1kg", organicCertified: true, countryOfOrigin: "India" },
      ],
      Wheat: [
        { name: "Whole Wheat Grain", price: 150, weight: "5kg", countryOfOrigin: "India" },
        { name: "Organic Wheat Berries", price: 190, weight: "1kg", organicCertified: true, countryOfOrigin: "India" },
      ],
      Atta: [
        { name: "Chakki Fresh Atta", price: 240, weight: "5kg", brand: "NatureCart Farms", countryOfOrigin: "India" },
        { name: "Multigrain Atta", price: 260, mrp: 290, weight: "5kg", countryOfOrigin: "India" },
      ],
      Millets: [
        { name: "Foxtail Millet", price: 110, weight: "500g", organicCertified: true, glutenFree: true, countryOfOrigin: "India" },
        { name: "Organic Ragi (Finger Millet)", price: 95, weight: "500g", organicCertified: true, glutenFree: true, countryOfOrigin: "India" },
      ],
      Oats: [
        { name: "Rolled Oats", price: 180, weight: "1kg", glutenFree: true, countryOfOrigin: "India" },
        { name: "Steel Cut Oats", price: 210, weight: "1kg", glutenFree: true, countryOfOrigin: "India" },
      ],
      Quinoa: [
        { name: "White Quinoa", price: 320, weight: "500g", organicCertified: true, vegan: true, glutenFree: true, countryOfOrigin: "Peru" },
        { name: "Organic Tricolor Quinoa", price: 380, mrp: 420, weight: "500g", organicCertified: true, vegan: true, glutenFree: true, countryOfOrigin: "Peru" },
      ],
      Flour: [
        { name: "Besan (Gram Flour)", price: 130, weight: "1kg", vegan: true, countryOfOrigin: "India" },
        { name: "Rice Flour", price: 90, weight: "1kg", glutenFree: true, vegan: true, countryOfOrigin: "India" },
      ],
      // Jau-Chana is deliberately not glutenFree - jau is barley. The 500g
      // chana pack pins itself as featured rather than relying on the
      // index-0 default, since sattu is the flagship line.
      Sattu: [
        { name: "Chana Sattu (Roasted Bengal Gram Flour)", price: 120, mrp: 150, weight: "500g", brand: "NatureCart Farms", organicCertified: true, vegan: true, glutenFree: true, featured: true, countryOfOrigin: "India" },
        { name: "Chana Sattu (Roasted Bengal Gram Flour) - Family Pack", price: 220, mrp: 270, weight: "1kg", brand: "NatureCart Farms", organicCertified: true, vegan: true, glutenFree: true, countryOfOrigin: "India" },
        { name: "Jau-Chana Sattu (Barley & Gram)", price: 135, weight: "500g", brand: "NatureCart Farms", organicCertified: true, vegan: true, countryOfOrigin: "India" },
      ],
    },
  },
  {
    name: "Pulses & Lentils",
    bg: "efebe9",
    fg: "5d4037",
    subcategories: {
      "Toor Dal": [
        { name: "Premium Toor Dal", price: 160, weight: "1kg", vegan: true, countryOfOrigin: "India" },
        { name: "Organic Arhar Dal", price: 195, weight: "1kg", organicCertified: true, vegan: true, countryOfOrigin: "India" },
      ],
      "Moong Dal": [
        { name: "Yellow Moong Dal", price: 140, weight: "1kg", vegan: true, countryOfOrigin: "India" },
        { name: "Split Green Moong Dal", price: 150, weight: "1kg", vegan: true, countryOfOrigin: "India" },
      ],
      "Masoor Dal": [
        { name: "Whole Masoor Dal", price: 120, weight: "1kg", vegan: true, countryOfOrigin: "India" },
        { name: "Split Masoor Dal", price: 115, weight: "1kg", vegan: true, countryOfOrigin: "India" },
      ],
      "Chana Dal": [
        { name: "Premium Chana Dal", price: 110, weight: "1kg", vegan: true, countryOfOrigin: "India" },
        { name: "Organic Chana Dal", price: 145, weight: "1kg", organicCertified: true, vegan: true, countryOfOrigin: "India" },
      ],
      "Urad Dal": [
        { name: "Split Urad Dal", price: 155, weight: "1kg", vegan: true, countryOfOrigin: "India" },
        { name: "Whole Black Urad Dal", price: 170, weight: "1kg", vegan: true, countryOfOrigin: "India" },
      ],
      Rajma: [
        { name: "Kashmiri Rajma", price: 210, mrp: 240, weight: "1kg", vegan: true, countryOfOrigin: "India" },
        { name: "Chitra Rajma", price: 180, weight: "1kg", vegan: true, countryOfOrigin: "India" },
      ],
      Chickpeas: [
        { name: "Kabuli Chana", price: 165, weight: "1kg", vegan: true, countryOfOrigin: "India" },
        { name: "Organic White Chickpeas", price: 190, weight: "1kg", organicCertified: true, vegan: true, countryOfOrigin: "India" },
      ],
    },
  },
  {
    name: "Dry Fruits & Nuts",
    bg: "fbe9e7",
    fg: "bf360c",
    subcategories: {
      Almonds: [
        { name: "California Almonds", price: 620, mrp: 700, weight: "500g", vegan: true, countryOfOrigin: "USA" },
        { name: "Organic Mamra Almonds", price: 1450, weight: "500g", organicCertified: true, vegan: true, countryOfOrigin: "Afghanistan" },
      ],
      Cashews: [
        { name: "Whole Cashew W240", price: 780, weight: "500g", vegan: true, countryOfOrigin: "India" },
        { name: "Broken Cashew Pieces", price: 520, weight: "500g", vegan: true, countryOfOrigin: "India" },
      ],
      Walnuts: [
        { name: "Kashmiri Walnut Kernels", price: 890, weight: "500g", vegan: true, countryOfOrigin: "India" },
        { name: "Whole Walnuts In Shell", price: 560, weight: "1kg", vegan: true, countryOfOrigin: "India" },
      ],
      Pistachios: [
        { name: "Roasted Salted Pistachios", price: 950, weight: "500g", vegan: true, countryOfOrigin: "USA" },
        { name: "Iranian Pistachios", price: 1100, mrp: 1250, weight: "500g", vegan: true, countryOfOrigin: "Iran" },
      ],
      Raisins: [
        { name: "Golden Raisins", price: 210, weight: "500g", vegan: true, countryOfOrigin: "India" },
        { name: "Black Seedless Raisins", price: 195, weight: "500g", vegan: true, countryOfOrigin: "India" },
      ],
      Dates: [
        { name: "Medjool Dates", price: 480, weight: "500g", vegan: true, countryOfOrigin: "Saudi Arabia" },
        { name: "Khajur Dates Premium", price: 260, weight: "500g", vegan: true, countryOfOrigin: "India" },
      ],
      "Mixed Nuts": [
        { name: "Premium Mixed Nuts Pack", price: 680, weight: "500g", vegan: true, countryOfOrigin: "India" },
        { name: "Roasted Trail Mix Nuts", price: 540, mrp: 600, weight: "400g", vegan: true, countryOfOrigin: "India" },
      ],
    },
  },
  {
    name: "Seeds & Superfoods",
    bg: "f1f8e9",
    fg: "33691e",
    subcategories: {
      "Chia Seeds": [
        { name: "Organic Chia Seeds", price: 240, weight: "250g", organicCertified: true, vegan: true, glutenFree: true, countryOfOrigin: "Mexico" },
        { name: "Raw Chia Seeds", price: 190, weight: "250g", vegan: true, glutenFree: true, countryOfOrigin: "Mexico" },
      ],
      "Flax Seeds": [
        { name: "Roasted Flax Seeds", price: 130, weight: "250g", vegan: true, glutenFree: true, countryOfOrigin: "India" },
        { name: "Organic Flax Seeds", price: 160, weight: "250g", organicCertified: true, vegan: true, glutenFree: true, countryOfOrigin: "India" },
      ],
      "Pumpkin Seeds": [
        { name: "Roasted Pumpkin Seeds", price: 210, weight: "200g", vegan: true, glutenFree: true, countryOfOrigin: "India" },
        { name: "Raw Pumpkin Seeds", price: 195, weight: "200g", vegan: true, glutenFree: true, countryOfOrigin: "India" },
      ],
      "Sunflower Seeds": [
        { name: "Roasted Sunflower Seeds", price: 150, weight: "250g", vegan: true, glutenFree: true, countryOfOrigin: "India" },
        { name: "Raw Sunflower Kernels", price: 140, weight: "250g", vegan: true, glutenFree: true, countryOfOrigin: "India" },
      ],
      Moringa: [
        { name: "Moringa Leaf Powder", price: 220, weight: "200g", organicCertified: true, vegan: true, countryOfOrigin: "India" },
        { name: "Organic Moringa Capsules", price: 350, weight: "60 capsules", organicCertified: true, vegan: true, countryOfOrigin: "India" },
        { name: "Dried Moringa Leaves (Whole Sahjan Patta)", price: 180, weight: "100g", brand: "NatureCart Farms", organicCertified: true, vegan: true, glutenFree: true, featured: true, countryOfOrigin: "India" },
        { name: "Dried Moringa Cut Pieces (Sahjan)", price: 210, weight: "200g", brand: "NatureCart Farms", organicCertified: true, vegan: true, glutenFree: true, countryOfOrigin: "India" },
        { name: "Stone-Ground Moringa Leaf Powder", price: 320, mrp: 380, weight: "250g", brand: "NatureCart Farms", organicCertified: true, vegan: true, glutenFree: true, countryOfOrigin: "India" },
      ],
      Spirulina: [
        { name: "Spirulina Powder", price: 480, weight: "200g", vegan: true, countryOfOrigin: "India" },
        { name: "Organic Spirulina Tablets", price: 520, mrp: 580, weight: "100 tablets", organicCertified: true, vegan: true, countryOfOrigin: "India" },
      ],
      Quinoa: [
        { name: "Superfood Quinoa Mix", price: 340, weight: "500g", vegan: true, glutenFree: true, countryOfOrigin: "Peru" },
        { name: "Organic White Quinoa Seeds", price: 360, weight: "500g", organicCertified: true, vegan: true, glutenFree: true, countryOfOrigin: "Peru" },
      ],
    },
  },
  {
    name: "Spices & Masalas",
    bg: "fff3e0",
    fg: "e65100",
    subcategories: {
      "Whole Spices": [
        { name: "Whole Cumin Seeds", price: 90, weight: "200g", vegan: true, countryOfOrigin: "India" },
        { name: "Black Peppercorns", price: 160, weight: "100g", vegan: true, countryOfOrigin: "India" },
        { name: "Raw Whole Turmeric Fingers (Sun-Dried Haldi)", price: 185, mrp: 230, weight: "250g", brand: "NatureCart Farms", organicCertified: true, vegan: true, glutenFree: true, featured: true, countryOfOrigin: "India" },
        { name: "Whole Coriander Seeds (Farm Raw Dhania)", price: 95, weight: "250g", brand: "NatureCart Farms", organicCertified: true, vegan: true, glutenFree: true, countryOfOrigin: "India" },
        { name: "Whole Coriander Seeds (Farm Raw Dhania) - Value Pack", price: 175, mrp: 210, weight: "500g", brand: "NatureCart Farms", organicCertified: true, vegan: true, glutenFree: true, countryOfOrigin: "India" },
      ],
      "Ground Spices": [
        { name: "Turmeric Powder", price: 70, weight: "200g", organicCertified: true, vegan: true, countryOfOrigin: "India" },
        { name: "Red Chilli Powder", price: 85, weight: "200g", vegan: true, countryOfOrigin: "India" },
        { name: "Stone-Ground Turmeric Powder (Raw Haldi)", price: 150, weight: "250g", brand: "NatureCart Farms", organicCertified: true, vegan: true, glutenFree: true, countryOfOrigin: "India" },
        { name: "Stone-Ground Coriander Powder (Dhania)", price: 110, weight: "250g", brand: "NatureCart Farms", organicCertified: true, vegan: true, glutenFree: true, countryOfOrigin: "India" },
      ],
      "Blended Masalas": [
        { name: "Garam Masala Blend", price: 110, weight: "100g", brand: "NatureCart Kitchen", vegan: true, countryOfOrigin: "India" },
        { name: "Chole Masala", price: 95, weight: "100g", brand: "NatureCart Kitchen", vegan: true, countryOfOrigin: "India" },
      ],
      Herbs: [
        { name: "Dried Oregano", price: 60, weight: "50g", vegan: true, countryOfOrigin: "India" },
        { name: "Dried Basil Leaves", price: 65, weight: "50g", vegan: true, countryOfOrigin: "India" },
      ],
      Salt: [
        { name: "Himalayan Pink Salt", price: 120, weight: "1kg", vegan: true, countryOfOrigin: "Pakistan" },
        { name: "Rock Salt (Sendha Namak)", price: 60, weight: "500g", vegan: true, countryOfOrigin: "India" },
      ],
      "Organic Seasonings": [
        { name: "Organic Pizza Seasoning", price: 140, weight: "75g", organicCertified: true, vegan: true, countryOfOrigin: "India" },
        { name: "Organic Chaat Masala", price: 90, mrp: 100, weight: "100g", organicCertified: true, vegan: true, countryOfOrigin: "India" },
      ],
    },
  },
  {
    name: "Organic Grocery",
    bg: "f1f8e9",
    fg: "1b5e20",
    subcategories: {
      Pickles: [
        { name: "Mango Pickle", price: 140, weight: "400g", vegan: true, countryOfOrigin: "India" },
        { name: "Mixed Vegetable Pickle", price: 130, weight: "400g", vegan: true, countryOfOrigin: "India" },
      ],
      Sauces: [
        { name: "Organic Tomato Ketchup", price: 110, weight: "500g", organicCertified: true, vegan: true, countryOfOrigin: "India" },
        { name: "Soy Sauce", price: 95, weight: "250ml", vegan: true, countryOfOrigin: "India" },
      ],
      Spreads: [
        { name: "Peanut Butter (Crunchy)", price: 220, weight: "500g", vegan: true, countryOfOrigin: "India" },
        { name: "Chocolate Hazelnut Spread", price: 260, mrp: 290, weight: "350g", countryOfOrigin: "India" },
      ],
      Pasta: [
        { name: "Durum Wheat Pasta", price: 110, weight: "500g", vegan: true, countryOfOrigin: "Italy" },
        { name: "Organic Whole Wheat Pasta", price: 140, weight: "500g", organicCertified: true, vegan: true, countryOfOrigin: "Italy" },
      ],
      Noodles: [
        { name: "Hakka Noodles", price: 85, weight: "500g", vegan: true, countryOfOrigin: "India" },
        { name: "Whole Wheat Noodles", price: 95, weight: "500g", vegan: true, countryOfOrigin: "India" },
      ],
      "Baking Essentials": [
        { name: "Baking Powder", price: 60, weight: "100g", vegan: true, countryOfOrigin: "India" },
        { name: "Instant Dry Yeast", price: 90, weight: "100g", vegan: true, countryOfOrigin: "India" },
      ],
    },
  },
];

let created = 0;
let skipped = 0;

for (const category of CATEGORIES) {
  const parentSlug = slugify(category.name);

  for (const [subName, products] of Object.entries(category.subcategories)) {
    const subSlug = `${parentSlug}-${slugify(subName)}`;

    const subcategory = await prisma.category.findUnique({ where: { slug: subSlug } });

    if (!subcategory) {
      console.warn(`Skipping "${subName}" under "${category.name}" - category slug ${subSlug} not found`);
      skipped += products.length;
      continue;
    }

    for (let i = 0; i < products.length; i++) {
      const item = products[i];

      const existing = await prisma.product.findFirst({ where: { name: item.name } });
      if (existing) {
        skipped++;
        continue;
      }

      const product = await prisma.product.create({
        data: {
          name: item.name,
          description: `${item.name} - a premium ${subName.toLowerCase()} pick from NatureCart's ${category.name} range.`,
          price: item.price,
          mrp: item.mrp ?? null,
          image: placeholderImage(item.name, category.bg, category.fg),
          images: placeholderGalleryImages(item.name, category.bg, category.fg),
          imageAlt: imageAltText(item, subName),
          category: subName,
          stock: 25 + ((i * 7) % 50),
          brand: item.brand ?? null,
          weight: item.weight ?? null,
          countryOfOrigin: item.countryOfOrigin ?? null,
          organicCertified: Boolean(item.organicCertified),
          vegan: Boolean(item.vegan),
          glutenFree: Boolean(item.glutenFree),
          sugarFree: Boolean(item.sugarFree),
          ecoFriendly: Boolean(item.ecoFriendly),
          // First product in every subcategory is featured, so every
          // category's Featured Products section has at least one item.
          featured: item.featured ?? i === 0,
        },
      });

      await prisma.productCategory.create({
        data: { productId: product.id, categoryId: subcategory.id },
      });

      created++;
    }
  }
}

console.log(`Seeded ${created} products across ${CATEGORIES.length} main categories (${skipped} skipped as already existing or missing category).`);
await prisma.$disconnect();
