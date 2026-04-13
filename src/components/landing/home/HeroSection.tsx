import { Button } from "@/components/ui/button";
import AnimatedSection from "@/components/landing/AnimatedSection";
import { Link } from "react-router-dom";

import lunoImg from "@/assets/landing/luno-hero.png";

const funFacts = [
  "🧠 Critical Thinking",
  "🎨 Creativity",
  "📖 Storytelling",
  "💡 Problem Solving",
];

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center section-padding pt-28 overflow-hidden bg-background">

      <div className="container grid md:grid-cols-2 gap-12 items-center relative z-10">
        <div>
          <AnimatedSection>
            <p className="text-label mb-4">✨ Step Into Your Own World</p>
          </AnimatedSection>
          <AnimatedSection delay={0.2}>
            <h1 className="font-heading text-4xl md:text-[56px] font-bold leading-tight text-foreground mb-6 whitespace-nowrap">
              Yo! I'm Luno! <span className="text-primary" style={{ textShadow: '0 0 12px hsl(174 60% 51% / 0.6), 0 0 24px hsl(174 60% 51% / 0.3)', WebkitTextStroke: '1px hsl(174, 60%, 38%)' }}>♥</span>
            </h1>
          </AnimatedSection>
          <AnimatedSection delay={0.4}>
            <p className="font-body text-lg text-muted-foreground leading-[1.7] mb-6 max-w-[520px]">
              I'm your guide to a world of adventures, stories, and amazing discoveries — and I can't wait to get started with you!
            </p>
          </AnimatedSection>

          <AnimatedSection delay={0.55}>
            <div className="flex flex-wrap gap-2 mb-8">
              {funFacts.map((fact, i) => (
                <span
                  key={i}
                  className="inline-flex items-center px-4 py-1.5 rounded-pill text-sm font-body font-semibold border border-border bg-card text-foreground"
                >
                  {fact}
                </span>
              ))}
            </div>
          </AnimatedSection>

          <AnimatedSection delay={0.6}>
            <div className="flex flex-wrap gap-4">
              <Button size="lg" asChild>
                <Link to="/signup">Let's Chat! ✨</Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link to="/for-parents">For Parents →</Link>
              </Button>
            </div>
            <p className="font-body text-sm text-muted-foreground mt-3">
              Parent sign-up required · No credit card needed
            </p>
            <p className="font-body text-sm text-muted-foreground mt-1">
              AI built for children. Safe by design. Governed by parents.
            </p>
          </AnimatedSection>
        </div>

        <AnimatedSection delay={0.3} className="flex justify-center relative">
          <img
            src={lunoImg}
            alt="Luno, your curious guide"
            className="w-72 md:w-[420px] animate-float drop-shadow-2xl relative z-10"
          />
        </AnimatedSection>
      </div>
    </section>
  );
}
