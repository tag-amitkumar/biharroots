import HeroSection from "@/components/HeroSection";
import FeaturedCollections from "@/components/FeaturedCollections";
import Categories from "@/components/Categories";
import DietaryPreferences from "@/components/DietaryPreferences";
import OfferBanner from "@/components/OfferBanner";
import ProductSection from "@/features/products/components/ProductSection";
import TrendingProducts from "@/features/products/components/TrendingProducts";
import SeasonalRecommendations from "@/features/products/components/SeasonalRecommendations";
import BestSellers from "@/features/products/components/BestSellers";
import RecommendedForYou from "@/features/products/components/RecommendedForYou";
import ContinueShoppingBand from "@/features/products/components/ContinueShoppingBand";
import CustomerReviews from "@/features/reviews/components/CustomerReviews";
import BrandStory from "@/components/BrandStory";
import Newsletter from "@/components/Newsletter";

export default function HomePage() {
  return (
    <main className="bg-canvas dark:bg-canvas-dark">

      <HeroSection />
      <ContinueShoppingBand />
      <FeaturedCollections />
      <Categories />
      <DietaryPreferences />
      <ProductSection />
      <TrendingProducts />
      <SeasonalRecommendations />
      <OfferBanner />
      <BestSellers />
      <RecommendedForYou />
      <CustomerReviews />
      <BrandStory />
      <Newsletter />

    </main>

  );
}
