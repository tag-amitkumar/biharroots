import ProductCard from "@/features/products/components/ProductCard";

type Product = {
  id: string;
  name: string;
  price: number;
  image: string;
  description: string;
};

type Rating = { avgRating: number; reviewCount: number };

export default function CategorySection({
  eyebrow,
  title,
  products,
  ratingByProductId,
}: {
  eyebrow: string;
  title: string;
  products: Product[];
  ratingByProductId: Map<string, Rating>;
}) {
  if (products.length === 0) return null;

  return (
    <section className="mt-16">
      <p className="text-sm font-semibold uppercase tracking-widest text-brand-600">{eyebrow}</p>
      <h2 className="mt-2 mb-6 font-display text-3xl font-extrabold text-neutral-900 dark:text-white">
        {title}
      </h2>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
        {products.map((product) => {
          const rating = ratingByProductId.get(product.id);

          return (
            <ProductCard
              key={product.id}
              product={{
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.image,
                description: product.description,
                rating: rating?.avgRating,
                reviewCount: rating?.reviewCount,
              }}
            />
          );
        })}
      </div>
    </section>
  );
}
