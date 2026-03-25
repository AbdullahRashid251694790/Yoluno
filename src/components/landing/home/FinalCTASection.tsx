import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import AnimatedSection from "@/components/landing/AnimatedSection";

export default function FinalCTASection() {
  return (
    <section className="section-padding text-center relative overflow-hidden bg-background grain-overlay">
      {/* Soft radial teal glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[600px] h-[400px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(61,214,200,0.06) 0%, transparent 70%)' }} />
      </div>

      <div className="container max-w-2xl relative z-10">
        <AnimatedSection>
          <h2 className="font-heading-landing text-3xl md:text-[38px] font-bold text-foreground mb-4">
            When you're ready, Yoluno is here.
          </h2>
          <p className="font-body text-muted-foreground text-lg mb-8">
            No pressure. No noise. Just a safe place to begin.
          </p>
          <Button size="lg" className="px-12 py-5 text-base" asChild>
            <Link to="/signup">Start Free Trial</Link>
          </Button>
          <p className="font-body text-muted-foreground text-sm mt-4">No credit card required</p>
        </AnimatedSection>
      </div>
    </section>
  );
}
