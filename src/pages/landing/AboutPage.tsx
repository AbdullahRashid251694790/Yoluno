import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import AnimatedSection from "@/components/landing/AnimatedSection";
import DriftingClouds from "@/components/landing/DriftingClouds";
import ScrollSparkles from "@/components/landing/ScrollSparkles";
import CloudDivider from "@/components/landing/CloudDivider";
import lunoImg from "@/assets/landing/luno.png";
import lumiImg from "@/assets/landing/lumi.png";
import lotiImg from "@/assets/landing/loti.png";

const principles = [
  { icon: "🛡️", text: "A child's attention will never be treated as a commodity" },
  { icon: "🔒", text: "Yoluno will never connect to the open internet" },
  { icon: "🌱", text: "Safety will never be traded for growth" },
  { icon: "👨‍👩‍👧", text: "Families will always come before metrics" },
];

export default function AboutPage() {
  return (
    <main className="pt-20 relative">
      <ScrollSparkles />

      {/* ─── Hero: The Invitation ─── */}
      <section className="relative min-h-[80vh] flex items-center section-padding overflow-hidden" style={{ background: 'linear-gradient(180deg, #FFFDF7 0%, #B4DED7 50%, #E0F2F1 100%)' }}>
        <DriftingClouds />
        <div className="container max-w-3xl text-center relative z-10">
          <AnimatedSection>
            <p className="text-label mb-5">About Yoluno</p>
            <h1 className="font-heading-landing text-4xl md:text-[56px] font-bold text-foreground mb-8 leading-[1.15]">
              Why Yoluno Exists
            </h1>
            <p className="font-body text-lg md:text-xl text-muted-foreground leading-[1.8] max-w-2xl mx-auto">
              A calm digital world built for curiosity, imagination, and childhood — designed with care by people who believe technology should support families, not compete with them.
            </p>
          </AnimatedSection>
          <AnimatedSection delay={0.4} className="flex justify-center mt-14">
            <div className="relative">
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-72 h-72 rounded-full animate-pulse-soft" style={{ background: 'radial-gradient(circle, rgba(61,214,200,0.2) 0%, rgba(61,214,200,0.05) 50%, transparent 70%)' }} />
              </div>
              <img
                src={lunoImg}
                alt="Luno sitting peacefully on a glowing cloud"
                className="w-44 md:w-60 animate-float relative z-10 character-bloom"
              />
            </div>
          </AnimatedSection>
        </div>
      </section>

      <CloudDivider />

      {/* ─── Section 1: The Digital Gap ─── */}
      <section className="section-padding relative">
        <DriftingClouds />
        <div className="container max-w-2xl relative z-10">
          <AnimatedSection>
            <p className="text-label mb-4">The Gap</p>
            <h2 className="font-heading-landing text-3xl md:text-[42px] font-bold text-foreground mb-8 leading-[1.2]">
              The World Children Are Growing Up In
            </h2>
          </AnimatedSection>
          <AnimatedSection delay={0.15}>
            <div className="space-y-6 font-body text-lg text-muted-foreground leading-[1.8]">
              <p>
                When we looked at the digital world our children were growing up in, something felt off.
              </p>
              <p>
                Most technology built for children wasn't designed around childhood at all.
                It was designed for engagement, growth metrics, and attention.
              </p>
              <div className="py-4">
                <p className="font-heading-landing text-foreground text-xl md:text-2xl italic leading-relaxed">
                  Not for wonder.<br />
                  Not for imagination.<br />
                  Not for the quiet pace that children actually need.
                </p>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      <CloudDivider flip />

      {/* ─── Section 2: The Belief ─── */}
      <section className="section-padding relative">
        <div className="container max-w-4xl relative z-10">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <AnimatedSection>
              <p className="text-label mb-4">The Belief</p>
              <h2 className="font-heading-landing text-3xl md:text-[38px] font-bold text-foreground mb-8 leading-[1.2]">
                What We Believe
              </h2>
              <div className="space-y-6 font-body text-lg text-muted-foreground leading-[1.8]">
                <p>Children don't need more content.</p>
                <p>
                  They need time to explore.<br />
                  Space to imagine.<br />
                  Conversations that move at their pace.
                </p>
                <p>
                  They deserve environments that are calm, thoughtful, and gently guided — not systems designed to capture and hold their attention.
                </p>
                <p className="font-heading-landing text-foreground italic text-xl md:text-2xl pt-2">
                  Childhood should never be rushed.
                </p>
              </div>
            </AnimatedSection>
            <AnimatedSection delay={0.25} className="flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-64 h-64 rounded-full animate-pulse-soft" style={{ background: 'radial-gradient(circle, rgba(122,201,67,0.15) 0%, transparent 70%)' }} />
                </div>
                <img
                  src={lumiImg}
                  alt="Lumi floating among dreamlike clouds"
                  className="w-40 md:w-52 animate-float relative z-10 character-bloom-lumi"
                />
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      <CloudDivider />

      {/* ─── Section 3: Why We Built Yoluno ─── */}
      <section className="section-padding relative">
        <div className="container max-w-2xl relative z-10">
          <AnimatedSection>
            <p className="text-label mb-4">The Decision</p>
            <h2 className="font-heading-landing text-3xl md:text-[42px] font-bold text-foreground mb-8 leading-[1.2]">
              Why We Built Yoluno
            </h2>
          </AnimatedSection>
          <AnimatedSection delay={0.15}>
            <div className="space-y-6 font-body text-lg text-muted-foreground leading-[1.8]">
              <p>Instead of building another app, we chose to build something different.</p>
              <p className="font-heading-landing text-foreground italic text-xl md:text-2xl">
                A small digital world designed with care.
              </p>
              <p>
                A place where children can ask questions, create stories, explore ideas, and remember the people who love them — without being exposed to the open internet or the pressures of modern platforms.
              </p>
              <p>
                In Yoluno, curiosity is welcome, imagination is protected, and families remain in control.
              </p>
            </div>
          </AnimatedSection>
        </div>
      </section>

      <CloudDivider flip />

      {/* ─── Section 4: What We Hold True ─── */}
      <section className="section-padding relative">
        <DriftingClouds />
        <div className="container max-w-4xl relative z-10">
          <AnimatedSection className="text-center mb-14">
            <p className="text-label mb-4">Our Promises</p>
            <h2 className="font-heading-landing text-3xl md:text-[42px] font-bold text-foreground leading-[1.2]">
              What We Hold True
            </h2>
          </AnimatedSection>
          <div className="grid sm:grid-cols-2 gap-8">
            {principles.map((p, i) => (
              <AnimatedSection key={p.text} delay={i * 0.12}>
                <div className="glass-card rounded-3xl p-8 md:p-10 h-full flex flex-col items-start">
                  <span className="text-4xl mb-5">{p.icon}</span>
                  <p className="font-body text-foreground text-lg md:text-xl font-semibold leading-snug">
                    {p.text}
                  </p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      <CloudDivider />

      {/* ─── Section 5: Built by Parents ─── */}
      <section className="section-padding relative">
        <DriftingClouds />
        <div className="container max-w-5xl relative z-10">
          <AnimatedSection className="text-center mb-14">
            <p className="text-label mb-4">Who We Are</p>
            <h2 className="font-heading-landing text-3xl md:text-[42px] font-bold text-foreground leading-[1.2]">
              Built by Parents
            </h2>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 gap-16 items-start mb-20">
            <AnimatedSection>
              <div className="space-y-6 font-body text-lg text-muted-foreground leading-[1.8]">
                <p>Yoluno began with a simple wish.</p>
                <p>
                  That children could grow up with a digital space that felt thoughtful, safe, and full of possibility.
                </p>
                <p>
                  When we looked at the technology available to families, something felt missing. Most platforms were designed for engagement and attention — not for curiosity, imagination, or the pace of childhood.
                </p>
                <p className="font-heading-landing text-foreground italic text-xl md:text-2xl">
                  So we decided to build something different.
                </p>
                <p>
                  Yoluno is being created slowly and carefully — guided by one belief:
                </p>
                <p className="font-heading-landing text-foreground font-semibold text-xl md:text-2xl">
                  Childhood deserves better technology.
                </p>
              </div>
            </AnimatedSection>

            <AnimatedSection delay={0.2}>
              <div className="space-y-8">
                {/* Founder: Amrita */}
                <div className="glass-card rounded-3xl p-8 text-center">
                  <div className="w-24 h-24 mx-auto mb-5 rounded-full flex items-center justify-center" style={{ background: 'radial-gradient(circle, rgba(61,214,200,0.15) 0%, rgba(180,222,215,0.3) 100%)', boxShadow: '0 0 24px rgba(61,214,200,0.15)' }}>
                    <img src={lotiImg} alt="Amrita Sethi" className="w-16 h-16 object-contain character-bloom-lala" />
                  </div>
                  <h3 className="font-heading-landing text-xl font-bold text-foreground mb-1">Amrita Sethi</h3>
                  <p className="text-label text-xs mb-4">Founder</p>
                  <p className="font-body text-muted-foreground text-base leading-[1.7]">
                    Artist, technologist, and parent exploring how creativity and technology can support human growth rather than compete with it.
                  </p>
                </div>

                {/* Founder: Jawad */}
                <div className="glass-card rounded-3xl p-8 text-center">
                  <div className="w-24 h-24 mx-auto mb-5 rounded-full flex items-center justify-center" style={{ background: 'radial-gradient(circle, rgba(61,214,200,0.15) 0%, rgba(180,222,215,0.3) 100%)', boxShadow: '0 0 24px rgba(61,214,200,0.15)' }}>
                    <img src={lunoImg} alt="Jawad Ashraf" className="w-16 h-16 object-contain character-bloom" />
                  </div>
                  <h3 className="font-heading-landing text-xl font-bold text-foreground mb-1">Jawad Ashraf</h3>
                  <p className="text-label text-xs mb-4">Co-Founder & Technology Lead</p>
                  <p className="font-body text-muted-foreground text-base leading-[1.7]">
                    Engineer and technology leader, formerly CTO of The Entertainer app. Jawad leads the technology architecture behind Yoluno, ensuring the platform remains secure, private, and designed for families.
                  </p>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      <CloudDivider flip />

      {/* ─── Final CTA: The Horizon ─── */}
      <section className="relative min-h-[60vh] flex items-center section-padding overflow-hidden" style={{ background: 'linear-gradient(180deg, #E0F2F1 0%, #B4DED7 50%, #FFFDF7 100%)' }}>
        <DriftingClouds />
        <div className="container max-w-2xl text-center relative z-10">
          <AnimatedSection>
            <h2 className="font-heading-landing text-3xl md:text-[48px] font-bold text-foreground mb-8 leading-[1.15]">
              A Calm Place for Curious Minds
            </h2>
            <p className="font-body text-lg md:text-xl text-muted-foreground leading-[1.8] mb-3">
              Whenever curiosity appears, Yoluno will be here.
            </p>
            <p className="font-heading-landing text-foreground italic text-lg md:text-xl mb-12">
              No pressure. No noise. Just a quiet place to explore.
            </p>
            <div className="flex flex-wrap justify-center gap-5">
              <Button size="lg" className="shadow-[0_0_24px_rgba(61,214,200,0.3)]" asChild>
                <Link to="/signup">Start Free Trial</Link>
              </Button>
              <Button variant="gold" size="lg" className="shadow-[0_0_24px_rgba(212,168,67,0.2)]" asChild>
                <Link to="/features">Explore the World →</Link>
              </Button>
            </div>
          </AnimatedSection>
        </div>
      </section>
    </main>
  );
}
