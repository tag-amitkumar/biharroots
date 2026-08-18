import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// PNG (not the placehold.co default of SVG) so the browser never hits
// Next's SVG-optimizer restriction, and a category's subcategories share
// its color theme for visual family consistency in the nav/homepage.
function placeholderBanner(name, bg, fg) {
  return `https://placehold.co/800x450/${bg}/${fg}.png?text=${encodeURIComponent(name)}`;
}

// Real photography for the category grid, which previously rendered
// placehold.co tiles with the category name set as image text - legible but
// ugly, and it made every card look like a missing asset.
//
// Standard Unsplash-licence photos only. Unsplash+ images are served from
// plus.unsplash.com as premium_photo-* and require a paid subscription, so
// they are deliberately excluded - they dominate Unsplash's search results
// and would be a licensing problem on a commercial storefront.
const CATEGORY_PHOTOS = {
  "Grains, Rice & Flour": "photo-1586201375761-83865001e31c",
  "Pulses & Lentils": "photo-1612257416648-ee7a6c533b4f",
  "Dry Fruits & Nuts": "photo-1631815333332-e3ffb24e2bf8",
  "Seeds & Superfoods": "photo-1654923064926-be7e64267a31",
  "Spices & Masalas": "photo-1606951444141-e5533feb55be",
  "Organic Grocery": "photo-1488459716781-31db52582fe9",
};

// Cropped server-side to the 16:9 the cards render at, so the browser is not
// handed a 4000px original to downscale on every card.
function photoBanner(photoId) {
  return `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=800&h=450&q=80`;
}

// One organic-toned color pair per main category, in CATEGORIES order.
const CATEGORY_COLORS = [
  ["fff3c4", "8d6e00"], // Grains, Rice & Flour
  ["d7ccc8", "4e342e"], // Pulses & Lentils
  ["ffe0b2", "8d5524"], // Dry Fruits & Nuts
  ["c8e6c9", "1b5e20"], // Seeds & Superfoods
  ["ffccbc", "bf360c"], // Spices & Masalas
  ["e8f5e9", "1b5e20"], // Organic Grocery
];

// Exact-name lookup so every subcategory gets a genuinely relevant icon
// instead of inheriting its parent's - a handful of names repeat across
// categories (e.g. "Herbs", "Oats", "Quinoa") and consistently get the
// same icon each time, which is fine.
const SUBCATEGORY_ICONS = {
  
  "Herbs": "🌿", 
  "Rice": "🍚", "Wheat": "🌾", "Atta": "🌾", "Millets": "🌾", "Oats": "🥣",
  "Quinoa": "🌾", "Flour": "🌾", "Sattu": "🥤",
  "Toor Dal": "🫘", "Moong Dal": "🫘", "Masoor Dal": "🫘", "Chana Dal": "🫘",
  "Urad Dal": "🫘", "Rajma": "🫘", "Chickpeas": "🫘",
  "Almonds": "🌰", "Cashews": "🌰", "Walnuts": "🌰", "Pistachios": "🌰",
  "Raisins": "🍇", "Dates": "🌴", "Mixed Nuts": "🌰",
  "Chia Seeds": "🌱", "Flax Seeds": "🌱", "Pumpkin Seeds": "🌱",
  "Sunflower Seeds": "🌱", "Moringa": "🌿", "Spirulina": "🟢",
  "Whole Spices": "🌶️", "Ground Spices": "🌶️", "Blended Masalas": "🌶️",
  "Salt": "🧂", "Organic Seasonings": "🌶️",
  
  
  
  
  
  
  
  
  
  
  
  "Pickles": "🥒", "Sauces": "🍅", "Spreads": "🍯", "Pasta": "🍝",
  "Noodles": "🍜", "Baking Essentials": "🧁",
  
  
  
  
  
  
  
  
  
  
  
};

const CATEGORIES = [
  {
    name: "Grains, Rice & Flour",
    icon: "🌾",
    description: "Wholesome grains, rice varieties, and stone-ground flours for every kitchen.",
    subcategories: ["Rice", "Wheat", "Atta", "Millets", "Oats", "Quinoa", "Flour", "Sattu"],
  },
  {
    name: "Pulses & Lentils",
    icon: "🫘",
    description: "Protein-rich pulses and lentils sourced from trusted organic farms.",
    subcategories: [
      "Toor Dal",
      "Moong Dal",
      "Masoor Dal",
      "Chana Dal",
      "Urad Dal",
      "Rajma",
      "Chickpeas",
    ],
  },
  {
    name: "Dry Fruits & Nuts",
    icon: "🌰",
    description: "Premium dry fruits and nuts, naturally nutrient-dense and additive-free.",
    subcategories: ["Almonds", "Cashews", "Walnuts", "Pistachios", "Raisins", "Dates", "Mixed Nuts"],
  },
  {
    name: "Seeds & Superfoods",
    icon: "🌱",
    description: "Nutrient-packed seeds and superfoods to power a healthier lifestyle.",
    subcategories: [
      "Chia Seeds",
      "Flax Seeds",
      "Pumpkin Seeds",
      "Sunflower Seeds",
      "Moringa",
      "Spirulina",
      "Quinoa",
    ],
  },
  {
    name: "Spices & Masalas",
    icon: "🌶️",
    description: "Aromatic whole and ground spices, blended masalas, and seasonings.",
    subcategories: [
      "Whole Spices",
      "Ground Spices",
      "Blended Masalas",
      "Herbs",
      "Salt",
      "Organic Seasonings",
    ],
  },
  {
    name: "Organic Grocery",
    icon: "🛒",
    description: "Everyday organic grocery essentials for the modern pantry.",
    subcategories: ["Pickles", "Sauces", "Spreads", "Pasta", "Noodles", "Baking Essentials"],
  },
];

for (let i = 0; i < CATEGORIES.length; i++) {
  const category = CATEGORIES[i];
  const slug = slugify(category.name);
  const [bg, fg] = CATEGORY_COLORS[i] ?? ["e8f5e9", "1b5e20"];
  const photoId = CATEGORY_PHOTOS[category.name];
  // placeholderBanner stays as the fallback: renaming a category or adding a
  // new one without a photo should degrade to a tile, not to a broken image.
  const banner = photoId ? photoBanner(photoId) : placeholderBanner(category.name, bg, fg);

  const parent = await prisma.category.upsert({
    where: { slug },
    update: {
      name: category.name,
      icon: category.icon,
      description: category.description,
      banner,
      sortOrder: i,
    },
    create: {
      name: category.name,
      slug,
      icon: category.icon,
      description: category.description,
      banner,
      sortOrder: i,
      metaTitle: category.name,
      metaDescription: category.description,
    },
  });

  for (let j = 0; j < category.subcategories.length; j++) {
    const subName = category.subcategories[j];
    const subSlug = `${slug}-${slugify(subName)}`;
    const subIcon = SUBCATEGORY_ICONS[subName] ?? category.icon;
    // Subcategories inherit the parent's photo rather than getting their own
    // text tile - the card renders its name as a caption underneath, so the
    // label is not carrying the image's job.
    const subBanner = photoId ? photoBanner(photoId) : placeholderBanner(subName, bg, fg);

    await prisma.category.upsert({
      where: { slug: subSlug },
      update: {
        name: subName,
        icon: subIcon,
        banner: subBanner,
        parentId: parent.id,
        sortOrder: j,
      },
      create: {
        name: subName,
        slug: subSlug,
        icon: subIcon,
        banner: subBanner,
        parentId: parent.id,
        sortOrder: j,
        metaTitle: `${subName} | ${category.name}`,
        metaDescription: `Shop ${subName.toLowerCase()} under ${category.name} at NatureCart.`,
      },
    });
  }
}

const totalCategories = await prisma.category.count();
console.log(`Seeded ${CATEGORIES.length} main categories with ${totalCategories - CATEGORIES.length} subcategories (${totalCategories} total).`);
await prisma.$disconnect();
