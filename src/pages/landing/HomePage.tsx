import HeroSection from "@/components/landing/home/HeroSection";
import SpacesSection from "@/components/landing/home/SpacesSection";
import CharactersSection from "@/components/landing/home/CharactersSection";
import HowYouGrowSection from "@/components/landing/home/HowYouGrowSection";
import WorldSection from "@/components/landing/home/WorldSection";
import WhyYolunoSection from "@/components/landing/home/WhyYolunoSection";
import TrustSection from "@/components/landing/home/TrustSection";
import TestimonialsSection from "@/components/landing/home/TestimonialsSection";
import FinalCTASection from "@/components/landing/home/FinalCTASection";

export default function HomePage() {
  return (
    <main>
      <HeroSection />
      <SpacesSection />
      <CharactersSection />
      <HowYouGrowSection />
      <WorldSection />
      <WhyYolunoSection />
      <TrustSection />
      <TestimonialsSection />
      <FinalCTASection />
    </main>
  );
}
