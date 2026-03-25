import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import AnimatedSection from "@/components/landing/AnimatedSection";
import CloudDivider from "@/components/landing/CloudDivider";
import lunoImg from "@/assets/landing/luno.png";

export default function WhyYolunoSection() {
  return (
    <>
      <CloudDivider flip />
      <section className="section-padding relative overflow-hidden">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <AnimatedSection>
              <p className="text-label mb-4">💫 The Promise</p>
              <h2 className="font-heading-landing text-3xl md:text-[38px] font-bold text-foreground mb-6 leading-tight">
                A Place Just for You
              </h2>
              <div className="space-y-5 font-body text-lg text-muted-foreground leading-[1.8]">
                <p>
                  Yoluno is a world where you can be exactly who you are.
                </p>
                <p>
                  No loud noises, no scary ads, and no "hurry up." Just a beautiful place where your curiosity is the most important thing in the world.
                </p>
              </div>
              <div className="mt-8">
                <Button variant="gold" size="lg" className="shadow-[0_0_20px_rgba(212,168,67,0.2)]" asChild>
                  <Link to="/about">Learn More About Yoluno →</Link>
                </Button>
              </div>
            </AnimatedSection>

            <AnimatedSection delay={0.25} className="flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-72 h-72 rounded-full animate-pulse-soft" style={{ background: 'radial-gradient(circle, rgba(61,214,200,0.15) 0%, rgba(61,214,200,0.04) 50%, transparent 70%)' }} />
                </div>
                <img
                  src={lunoImg}
                  alt="Luno looking toward you with curiosity"
                  className="w-48 md:w-60 animate-float relative z-10 character-bloom"
                />
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>
      <CloudDivider />
    </>
  );
}
