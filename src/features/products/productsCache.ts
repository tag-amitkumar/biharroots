// Shared across every homepage section that needs the same data (Featured
// Collections, Featured Products, Trending, Best Sellers all read the full
// product/rating lists) so a single page load fires one request each,
// not one per section.

type Product = {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  description: string;
};

type Rating = { productId: string; avgRating: number; reviewCount: number };

let cachedProducts: Promise<Product[]> | null = null;
let cachedRatings: Promise<Rating[]> | null = null;

export function getAllProducts(): Promise<Product[]> {
  if (!cachedProducts) {
    cachedProducts = fetch("/api/products")
      .then((res) => res.json())
      .catch(() => []);
  }

  return cachedProducts;
}

export function getRatings(): Promise<Rating[]> {
  if (!cachedRatings) {
    cachedRatings = fetch("/api/products/ratings")
      .then((res) => res.json())
      .catch(() => []);
  }

  return cachedRatings;
}
