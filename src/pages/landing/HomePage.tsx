import HeroSection from "@/components/landing/home/HeroSection";
import TrustStripSection from "@/components/landing/home/TrustStripSection";
import CharactersSection from "@/components/landing/home/CharactersSection";
import HowYouGrowSection from "@/components/landing/home/HowYouGrowSection";
import MultilingualSection from "@/components/landing/home/MultilingualSection";
import WorldSection from "@/components/landing/home/WorldSection";
import WhyYolunoSection from "@/components/landing/home/WhyYolunoSection";
import TrustSection from "@/components/landing/home/TrustSection";
import TestimonialsSection from "@/components/landing/home/TestimonialsSection";
import FinalCTASection from "@/components/landing/home/FinalCTASection";

export default function HomePage() {
  return (
    <main>
      <HeroSection />
      <TrustStripSection />
      <WorldSection />
      <CharactersSection />
      <HowYouGrowSection />
      <MultilingualSection />
      <WhyYolunoSection />
      <TrustSection />
      <TestimonialsSection />
      <FinalCTASection />
    </main>
  );
}
