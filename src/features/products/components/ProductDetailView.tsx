"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";
import SafeImage from "@/components/SafeImage";

const MotionImage = motion(SafeImage);
import {
  Heart,
  Loader2,
  Minus,
  Plus,
  RotateCcw,
  Share2,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Truck,
  X,
  Zap,
} from "lucide-react";
import { useCartStore } from "@/features/cart/store";
import { useWishlist } from "@/features/wishlist/WishlistProvider";
import { useRecentlyViewedStore } from "@/features/products/recentlyViewedStore";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Variant = {
  id: string;
  label: string;
  price: number;
  stock: number;
};

type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  images: string;
  specifications: string;
  stock: number;
  variants: Variant[];
  detailedDescription?: string | null;
  highlights?: string;
  keyBenefits?: string;
  ingredients?: string | null;
  usageInstructions?: string | null;
  storageInstructions?: string | null;
  faqs?: string;
  imageAlt?: string | null;
};

function parseJsonArray(json: string | undefined): string[] {
  try {
    const parsed = JSON.parse(json || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function parseFAQs(json: string | undefined): { question: string; answer: string }[] {
  try {
    const parsed = JSON.parse(json || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// Case-insensitive substring match against real admin-entered spec keys
// (specifications is a free-text JSON blob, not a fixed schema) - so
// Nutrition Facts only ever shows real data the admin actually entered,
// split out of the generic Specifications table rather than duplicated.
const NUTRITION_KEY_PATTERNS = [
  "protein", "calorie", "energy", "fat", "carb", "fiber", "fibre",
  "sugar", "sodium", "calcium", "iron", "vitamin", "cholesterol",
];

function splitNutritionSpecs(specs: Record<string, string>) {
  const nutrition: [string, string][] = [];
  const other: [string, string][] = [];

  for (const entry of Object.entries(specs)) {
    const [key] = entry;
    (NUTRITION_KEY_PATTERNS.some((pattern) => key.toLowerCase().includes(pattern)) ? nutrition : other).push(
      entry
    );
  }

  return { nutrition, other };
}

function parseIngredientsList(ingredients: string | null | undefined): string[] {
  if (!ingredients?.trim()) return [];
  return ingredients.split(",").map((item) => item.trim()).filter(Boolean);
}

export default function ProductDetailView({
  product,
  rating = 0,
  reviewCount = 0,
}: {
  product: Product;
  rating?: number;
  reviewCount?: number;
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const { productIds, toggle } = useWishlist();
  const addToCart = useCartStore((state) => state.addToCart);
  const addViewed = useRecentlyViewedStore((state) => state.addViewed);

  const gallery = [
    product.image,
    ...product.images
      .split("\n")
      .map((url) => url.trim())
      .filter(Boolean),
  ];

  const [activeImage, setActiveImage] = useState(gallery[0]);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [isZooming, setIsZooming] = useState(false);
  const [zoomOrigin, setZoomOrigin] = useState("50% 50%");
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(
    product.variants[0] || null
  );
  const [quantity, setQuantity] = useState(1);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [ingredientExplanations, setIngredientExplanations] = useState<
    { ingredient: string; explanation: string }[] | null
  >(null);
  const [explainingIngredients, setExplainingIngredients] = useState(false);
  const [aiAvailable, setAiAvailable] = useState<boolean | null>(null);

  const imageRef = useRef<HTMLDivElement>(null);

  const isWishlisted = productIds.has(product.id);
  const effectivePrice = selectedVariant ? selectedVariant.price : product.price;
  const effectiveStock = selectedVariant ? selectedVariant.stock : product.stock;
  const hasRating = reviewCount > 0;

  useEffect(() => {
    addViewed(product.id);

    // Also record server-side for signed-in customers, so their viewing
    // history survives a logout/login or a switch to a new device - guests
    // keep only the localStorage-backed view recorded above.
    if (session?.user?.id) {
      fetch("/api/recently-viewed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id }),
      }).catch(() => {});
    }
    // Only needs to run once per product id (or once login state resolves),
    // not on every addViewed/session identity change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id, session?.user?.id]);

  useEffect(() => {
    function handleScroll() {
      setShowStickyBar(window.scrollY > 480);
    }

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    Promise.resolve().then(() => setQuantity(1));
  }, [selectedVariant]);

  useEffect(() => {
    fetch("/api/ai/status")
      .then((res) => res.json())
      .then((data) => setAiAvailable(Boolean(data.configured)))
      .catch(() => setAiAvailable(false));
  }, []);

  async function handleExplainIngredients() {
    setExplainingIngredients(true);

    try {
      const res = await fetch(`/api/products/${product.id}/explain-ingredients`, { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data?.error || "Could not generate an explanation");
        return;
      }

      setIngredientExplanations(data.explanations);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setExplainingIngredients(false);
    }
  }

  const specsAll: Record<string, string> = (() => {
    try {
      return JSON.parse(product.specifications || "{}");
    } catch {
      return {};
    }
  })();

  const { nutrition: nutritionEntries, other: specEntries } = splitNutritionSpecs(specsAll);
  const specs = Object.fromEntries(specEntries);
  const ingredientsList = parseIngredientsList(product.ingredients);

  const highlights = parseJsonArray(product.highlights);
  const keyBenefits = parseJsonArray(product.keyBenefits);
  const faqs = parseFAQs(product.faqs);

  function buildCartItem() {
    return {
      id: product.id,
      name: product.name,
      price: effectivePrice,
      image: product.image,
      variantId: selectedVariant?.id,
      variantLabel: selectedVariant?.label,
    };
  }

  function handleAddToCart() {
    if (effectiveStock <= 0) {
      toast.error("This item is out of stock");
      return;
    }

    for (let i = 0; i < quantity; i++) addToCart(buildCartItem());
    toast.success(`${product.name} added to cart`);
  }

  function handleBuyNow() {
    if (effectiveStock <= 0) {
      toast.error("This item is out of stock");
      return;
    }

    for (let i = 0; i < quantity; i++) addToCart(buildCartItem());
    router.push("/checkout");
  }

  async function handleShare() {
    const url = typeof window !== "undefined" ? window.location.href : "";

    const nav = navigator as Navigator & { share?: (data: { title: string; url: string }) => Promise<void> };

    if (nav.share) {
      try {
        await nav.share({ title: product.name, url });
      } catch {
        // User dismissed the native share sheet — not an error.
      }
      return;
    }

    await navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard");
  }

  async function handleWishlistToggle() {
    if (!session) {
      toast.error("Please log in to use the wishlist");
      return;
    }

    await toggle(product.id);
    toast.success(isWishlisted ? "Removed from wishlist" : "Added to wishlist");
  }

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!imageRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setZoomOrigin(`${x}% ${y}%`);
  }

  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + 3);

  return (
    <div>
      <div className="grid gap-12 lg:grid-cols-2">
        <div>
          <div
            ref={imageRef}
            onMouseEnter={() => setIsZooming(true)}
            onMouseLeave={() => setIsZooming(false)}
            onMouseMove={handleMouseMove}
            onClick={() => setZoomOpen(true)}
            className="relative block aspect-square w-full cursor-zoom-in overflow-hidden rounded-[32px] bg-neutral-100 dark:bg-neutral-900"
          >
            <AnimatePresence mode="wait">
              <MotionImage
                key={activeImage}
                src={activeImage}
                alt={product.imageAlt || product.name}
                fill
                priority
                sizes="(min-width: 1024px) 50vw, 100vw"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                style={{
                  transformOrigin: zoomOrigin,
                  transform: isZooming ? "scale(1.9)" : "scale(1)",
                }}
                className="object-cover transition-transform duration-200 ease-out"
              />
            </AnimatePresence>
          </div>

          {gallery.length > 1 && (
            <div className="mt-4 flex gap-3">
              {gallery.map((src) => (
                <button
                  key={src}
                  onClick={() => setActiveImage(src)}
                  className={cn(
                    "relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition-colors sm:h-20 sm:w-20",
                    activeImage === src ? "border-brand-600" : "border-transparent"
                  )}
                >
                  <SafeImage src={src} alt="" fill sizes="80px" className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <h1 className="font-display text-3xl font-bold text-neutral-900 dark:text-white sm:text-4xl">
            {product.name}
          </h1>

          <div className="mt-3 flex items-center gap-2">
            {hasRating ? (
              <>
                <div className="flex gap-0.5 text-amber-400">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className="h-4 w-4"
                      fill={i < Math.round(rating) ? "currentColor" : "none"}
                    />
                  ))}
                </div>
                <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">
                  {rating.toFixed(1)}
                </span>
                <span className="text-sm text-neutral-400">
                  ({reviewCount} review{reviewCount === 1 ? "" : "s"})
                </span>
              </>
            ) : (
              <Badge variant="secondary">No reviews yet</Badge>
            )}
          </div>

          <p className="mt-4 text-neutral-600 dark:text-neutral-300">{product.description}</p>

          {highlights.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-neutral-600 dark:text-neutral-300">
              {highlights.map((highlight) => (
                <li key={highlight} className="flex items-center gap-1.5">
                  <span className="h-1 w-1 rounded-full bg-brand-500" aria-hidden="true" />
                  {highlight}
                </li>
              ))}
            </ul>
          )}

          <div className="mt-6 text-4xl font-bold text-neutral-900 dark:text-white">
            ₹{effectivePrice}
          </div>

          <div className="mt-4">
            {effectiveStock > 10 ? (
              <Badge variant="success">In Stock</Badge>
            ) : effectiveStock > 0 ? (
              <Badge variant="warning">Only {effectiveStock} left</Badge>
            ) : (
              <Badge variant="destructive">Out of Stock</Badge>
            )}
          </div>

          {product.variants.length > 0 && (
            <div className="mt-6">
              <p className="mb-2 text-sm font-semibold text-neutral-700 dark:text-neutral-200">
                Pack Size
              </p>

              <div className="flex flex-wrap gap-2">
                {product.variants.map((variant) => (
                  <button
                    key={variant.id}
                    onClick={() => setSelectedVariant(variant)}
                    className={cn(
                      "rounded-xl border px-4 py-2 text-sm font-semibold transition-colors",
                      selectedVariant?.id === variant.id
                        ? "border-brand-600 bg-brand-50 text-brand-700 dark:bg-brand-900/20"
                        : "border-neutral-300 text-neutral-700 dark:border-neutral-700 dark:text-neutral-200"
                    )}
                  >
                    {variant.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6">
            <p className="mb-2 text-sm font-semibold text-neutral-700 dark:text-neutral-200">
              Quantity
            </p>

            <div className="inline-flex items-center rounded-xl border border-neutral-300 dark:border-neutral-700">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                aria-label="Decrease quantity"
                className="p-3 text-neutral-600 transition-colors hover:text-brand-600 disabled:opacity-30 dark:text-neutral-300"
              >
                <Minus className="h-4 w-4" />
              </button>

              <span className="w-10 text-center font-semibold text-neutral-900 dark:text-white">
                {quantity}
              </span>

              <button
                onClick={() => setQuantity((q) => Math.min(effectiveStock || 1, q + 1))}
                disabled={quantity >= effectiveStock}
                aria-label="Increase quantity"
                className="p-3 text-neutral-600 transition-colors hover:text-brand-600 disabled:opacity-30 dark:text-neutral-300"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          <p className="mt-6 flex items-center gap-2 text-sm text-neutral-500">
            <Truck className="h-4 w-4" />
            Estimated delivery by{" "}
            <span className="font-semibold text-neutral-700 dark:text-neutral-200">
              {deliveryDate.toLocaleDateString(undefined, {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </span>
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              onClick={handleAddToCart}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-600 to-brand-700 py-4 font-bold text-white shadow-lg shadow-brand-600/20 transition hover:brightness-105 active:scale-[0.98]"
            >
              <ShoppingBag className="h-4 w-4" /> Add To Cart
            </button>

            <button
              onClick={handleBuyNow}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl border-2 border-brand-600 py-4 font-bold text-brand-700 transition hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-900/20"
            >
              <Zap className="h-4 w-4" /> Buy Now
            </button>
          </div>

          <div className="mt-4 flex gap-3">
            <button
              onClick={handleWishlistToggle}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-neutral-200 py-3 text-sm font-semibold text-neutral-700 dark:border-neutral-700 dark:text-neutral-200"
            >
              <Heart className="h-4 w-4" fill={isWishlisted ? "currentColor" : "none"} />
              {isWishlisted ? "Wishlisted" : "Add to Wishlist"}
            </button>

            <button
              onClick={handleShare}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-neutral-200 py-3 text-sm font-semibold text-neutral-700 dark:border-neutral-700 dark:text-neutral-200"
            >
              <Share2 className="h-4 w-4" /> Share
            </button>
          </div>

          <div className="mt-8 grid grid-cols-3 gap-3 border-t border-neutral-200 pt-6 text-center text-xs text-neutral-500 dark:border-neutral-800">
            <div className="flex flex-col items-center gap-1">
              <ShieldCheck className="h-5 w-5 text-brand-600" />
              Secure Payment
            </div>

            <div className="flex flex-col items-center gap-1">
              <RotateCcw className="h-5 w-5 text-brand-600" />
              Easy Returns
            </div>

            <div className="flex flex-col items-center gap-1">
              <ShieldCheck className="h-5 w-5 text-brand-600" />
              Quality Assured
            </div>
          </div>

          {Object.keys(specs).length > 0 && (
            <div className="mt-8 border-t border-neutral-200 pt-6 dark:border-neutral-800">
              <h2 className="mb-3 text-lg font-bold text-neutral-900 dark:text-white">
                Specifications
              </h2>

              <table className="w-full text-sm">
                <tbody>
                  {Object.entries(specs).map(([key, value]) => (
                    <tr key={key} className="border-b border-neutral-100 dark:border-neutral-800">
                      <td className="py-2 pr-4 font-semibold text-neutral-500">
                        {key}
                      </td>
                      <td className="py-2 text-neutral-800 dark:text-neutral-200">{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {nutritionEntries.length > 0 && (
            <div className="mt-8 border-t border-neutral-200 pt-6 dark:border-neutral-800">
              <h2 className="mb-3 text-lg font-bold text-neutral-900 dark:text-white">
                Nutrition Facts
              </h2>

              <table className="w-full text-sm">
                <tbody>
                  {nutritionEntries.map(([key, value]) => (
                    <tr key={key} className="border-b border-neutral-100 dark:border-neutral-800">
                      <td className="py-2 pr-4 font-semibold text-neutral-500">{key}</td>
                      <td className="py-2 text-neutral-800 dark:text-neutral-200">{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {ingredientsList.length > 0 && (
            <div className="mt-8 border-t border-neutral-200 pt-6 dark:border-neutral-800">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-bold text-neutral-900 dark:text-white">Ingredients</h2>

                {aiAvailable && (
                  <button
                    onClick={handleExplainIngredients}
                    disabled={explainingIngredients}
                    className="flex items-center gap-1.5 rounded-full border border-brand-300 px-3 py-1.5 text-xs font-semibold text-brand-700 transition-colors hover:bg-brand-50 disabled:opacity-50 dark:border-brand-800 dark:text-brand-400 dark:hover:bg-brand-950/30"
                  >
                    {explainingIngredients ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                    ) : (
                      <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                    )}
                    Explain in Simple Terms
                  </button>
                )}
              </div>

              <p className="text-sm text-neutral-600 dark:text-neutral-300">{ingredientsList.join(", ")}</p>

              {aiAvailable === false && (
                <p className="mt-2 text-xs text-neutral-400">
                  Plain-language ingredient explanations require an AI provider to be configured.
                </p>
              )}

              {ingredientExplanations && ingredientExplanations.length > 0 && (
                <ul className="mt-4 space-y-3">
                  {ingredientExplanations.map((item) => (
                    <li key={item.ingredient}>
                      <p className="text-sm font-semibold text-neutral-900 dark:text-white">
                        {item.ingredient}
                      </p>
                      <p className="text-sm text-neutral-600 dark:text-neutral-300">{item.explanation}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {product.detailedDescription && (
            <div className="mt-8 border-t border-neutral-200 pt-6 dark:border-neutral-800">
              <h2 className="mb-3 text-lg font-bold text-neutral-900 dark:text-white">
                Product Details
              </h2>
              <p className="whitespace-pre-line text-sm text-neutral-600 dark:text-neutral-300">
                {product.detailedDescription}
              </p>
            </div>
          )}

          {keyBenefits.length > 0 && (
            <div className="mt-8 border-t border-neutral-200 pt-6 dark:border-neutral-800">
              <h2 className="mb-3 text-lg font-bold text-neutral-900 dark:text-white">Key Benefits</h2>
              <ul className="space-y-1.5 text-sm text-neutral-600 dark:text-neutral-300">
                {keyBenefits.map((benefit) => (
                  <li key={benefit} className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" aria-hidden="true" />
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {product.ingredients && (
            <div className="mt-8 border-t border-neutral-200 pt-6 dark:border-neutral-800">
              <h2 className="mb-3 text-lg font-bold text-neutral-900 dark:text-white">Ingredients</h2>
              <p className="whitespace-pre-line text-sm text-neutral-600 dark:text-neutral-300">
                {product.ingredients}
              </p>
            </div>
          )}

          {(product.usageInstructions || product.storageInstructions) && (
            <div className="mt-8 grid gap-6 border-t border-neutral-200 pt-6 sm:grid-cols-2 dark:border-neutral-800">
              {product.usageInstructions && (
                <div>
                  <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-neutral-900 dark:text-white">
                    Usage
                  </h2>
                  <p className="text-sm text-neutral-600 dark:text-neutral-300">
                    {product.usageInstructions}
                  </p>
                </div>
              )}

              {product.storageInstructions && (
                <div>
                  <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-neutral-900 dark:text-white">
                    Storage
                  </h2>
                  <p className="text-sm text-neutral-600 dark:text-neutral-300">
                    {product.storageInstructions}
                  </p>
                </div>
              )}
            </div>
          )}

          {faqs.length > 0 && (
            <div className="mt-8 border-t border-neutral-200 pt-6 dark:border-neutral-800">
              <h2 className="mb-3 text-lg font-bold text-neutral-900 dark:text-white">
                Frequently Asked Questions
              </h2>
              <div className="space-y-4">
                {faqs.map((faq) => (
                  <div key={faq.question}>
                    <p className="text-sm font-semibold text-neutral-900 dark:text-white">
                      {faq.question}
                    </p>
                    <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {zoomOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setZoomOpen(false)}
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
          >
            <button
              onClick={() => setZoomOpen(false)}
              aria-label="Close"
              className="absolute right-6 top-6 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            >
              <X className="h-5 w-5" />
            </button>

            <motion.img
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              src={activeImage}
              alt={product.name}
              className="max-h-[90vh] max-w-full rounded-2xl object-contain"
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showStickyBar && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-between gap-4 border-t border-neutral-200/70 bg-white/95 px-6 py-4 shadow-2xl backdrop-blur-xl dark:border-neutral-800 dark:bg-neutral-900/95"
          >
            <div className="flex items-center gap-3">
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg">
                <SafeImage src={product.image} alt="" fill sizes="48px" className="object-cover" />
              </div>

              <div>
                <p className="hidden font-semibold text-neutral-900 dark:text-white sm:block">
                  {product.name}
                </p>
                <p className="font-bold text-brand-600">₹{effectivePrice}</p>
              </div>
            </div>

            <button
              onClick={handleAddToCart}
              className="rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 px-6 py-3 font-bold text-white shadow-lg shadow-brand-600/20"
            >
              Add To Cart
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
