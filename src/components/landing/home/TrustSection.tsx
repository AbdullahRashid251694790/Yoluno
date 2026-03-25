import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import AnimatedSection from "@/components/landing/AnimatedSection";

const trustItems = [
  { icon: "🏡", label: "Closed Environment", desc: "Everything your child encounters is intentionally curated." },
  { icon: "🔒", label: "Parent-Governed", desc: "You set the boundaries. The experience operates within them." },
  { icon: "🌱", label: "Gentle & Adaptive", desc: "Responds to your child's curiosity — at their pace." },
];

export default function TrustSection() {
  return (
    <section className="section-padding" style={{ background: 'linear-gradient(180deg, #FFFDF7 0%, #F0F8F6 100%)' }}>
      <div className="container max-w-3xl text-center">
        <AnimatedSection>
          <p className="text-label mb-3">For Parents & Educators</p>
          <h2 className="font-heading-landing text-3xl md:text-[38px] font-bold text-foreground mb-6">
            A Calm Place for Growing Minds
          </h2>
          <p className="font-body text-lg text-text-body leading-[1.7] mb-12 max-w-[640px] mx-auto">
            Yoluno is a closed, intentional world — built for children, governed entirely by you. No open internet. No ads. No data monetisation. Just curiosity, protected.
          </p>
        </AnimatedSection>

        <AnimatedSection delay={0.2}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
            {trustItems.map((t) => (
              <div key={t.label} className="bg-card rounded-2xl p-6 shadow-warm-sm border border-border flex flex-col items-center gap-3">
                <span className="text-4xl">{t.icon}</span>
                <span className="font-body text-base font-bold text-foreground">{t.label}</span>
                <span className="font-body text-sm text-muted-foreground leading-relaxed">{t.desc}</span>
              </div>
            ))}
          </div>
        </AnimatedSection>

        <AnimatedSection delay={0.3}>
          <div className="flex flex-wrap justify-center gap-4">
            <Button asChild>
              <Link to="/for-parents">See How It Works</Link>
            </Button>
            <Button variant="gold" asChild>
              <Link to="/for-parents">Read Our Safety Charter</Link>
            </Button>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
