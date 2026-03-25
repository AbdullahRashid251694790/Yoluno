import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import AnimatedSection from "@/components/landing/AnimatedSection";
import FloatingParticles from "@/components/landing/FloatingParticles";
import lunoImg from "@/assets/landing/luno-hero.png";

const funFacts = [
  "🧠 Critical Thinking",
  "🎨 Creativity",
  "📖 Storytelling",
  "💡 Problem Solving",
];

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center section-padding pt-28 overflow-hidden" style={{ background: 'linear-gradient(180deg, #FFFDF7 0%, #E8F8F4 100%)' }}>
      <div
        className="absolute right-0 top-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-60 pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(61,214,200,0.06) 0%, transparent 70%)' }}
      />

      <FloatingParticles />

      <div className="container grid md:grid-cols-2 gap-12 items-center relative z-10">
        <div>
          <AnimatedSection>
            <p className="text-label mb-4">✨ Step Into Your Own World</p>
          </AnimatedSection>
          <AnimatedSection delay={0.2}>
            <h1 className="font-heading-landing text-4xl md:text-[56px] font-bold leading-tight text-foreground mb-6 whitespace-nowrap">
              Yo! I'm Luno! <span className="text-primary" style={{ textShadow: '0 0 12px hsl(174 60% 51% / 0.6), 0 0 24px hsl(174 60% 51% / 0.3)', WebkitTextStroke: '1px hsl(174, 60%, 38%)' }}>♥</span>
            </h1>
          </AnimatedSection>
          <AnimatedSection delay={0.4}>
            <p className="font-body text-lg text-text-body leading-[1.7] mb-4 max-w-[520px]">
              Your digital companion — I've been waiting for a curious friend like you. Together we'll go on adventures, tell stories, and discover amazing things!
            </p>
          </AnimatedSection>
          <AnimatedSection delay={0.5}>
            <p className="font-heading-landing text-muted-foreground italic text-lg mb-6">
              Where curiosity leads, wonder follows — powered by the latest technology.
            </p>
          </AnimatedSection>

          {/* Learning skills pills */}
          <AnimatedSection delay={0.55}>
            <div className="flex flex-wrap gap-2 mb-8">
              {funFacts.map((fact, i) => (
                <span
                  key={i}
                  className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-body font-semibold border"
                  style={{
                    backgroundColor: 'rgba(61,214,200,0.08)',
                    borderColor: 'rgba(61,214,200,0.25)',
                    color: 'hsl(var(--foreground))',
                  }}
                >
                  {fact}
                </span>
              ))}
            </div>
          </AnimatedSection>

          <AnimatedSection delay={0.6}>
            <div className="flex flex-wrap gap-4">
              <Button size="lg" asChild>
                <Link to="/signup">Let's Go! ✨</Link>
              </Button>
              <Button variant="gold" size="lg" asChild>
                <Link to="/for-parents">For Parents →</Link>
              </Button>
            </div>
          </AnimatedSection>
        </div>

        <AnimatedSection delay={0.3} className="flex justify-center relative">
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <div className="w-80 h-80 rounded-full" style={{ background: 'radial-gradient(circle, rgba(61,214,200,0.15) 0%, transparent 70%)' }} />
          </div>
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
