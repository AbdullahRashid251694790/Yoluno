import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import AnimatedSection from "@/components/landing/AnimatedSection";
import parentDashboard from "@/assets/landing/parent-dashboard.png";

const trustItems = [
  { icon: "🏡", label: "Closed Environment", desc: "No open internet. Every experience is designed within safety boundaries you control. The English National Curriculum — Key Stage 1 through Key Stage 4 — is built into Yoluno, so your child's exploration supports what they're learning at school." },
  { icon: "🔒", label: "Parent-Governed", desc: "You set the boundaries, review activity, and control all data. Nothing is shared, sold, or used to train AI models." },
  { icon: "🌱", label: "Gentle & Adaptive", desc: "Responds to your child's curiosity — at their pace, adapted to their age. Available in 20+ languages — including English, Arabic, French, and Chinese — all with the same safety filters and parent controls." },
];

export default function TrustSection() {
  return (
    <section className="section-padding bg-secondary">
      <div className="container max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left — Dashboard Image */}
          <AnimatedSection>
            <div className="rounded-2xl overflow-hidden shadow-warm border border-border">
              <img src={parentDashboard} alt="Yoluno Parent Dashboard showing children's moods, weekly progress, and quick actions" className="w-full h-auto" />
            </div>
          </AnimatedSection>

          {/* Right — Content */}
          <div>
            <AnimatedSection>
              <p className="text-label mb-3">For Parents & Educators</p>
              <h2 className="font-heading text-3xl md:text-[38px] text-foreground mb-6">
                Peace of Mind for Parents and Educators
              </h2>
              <p className="font-body text-[17px] text-muted-foreground leading-[1.7] mb-8">
                Yoluno is a closed, intentional world — built for children, governed entirely by you. Whether your child is learning from home or in the classroom, Yoluno gives them a safe, calm space to explore beyond the lesson plan. No open internet. No ads. No data monetisation.
              </p>
            </AnimatedSection>

            <AnimatedSection delay={0.15}>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                {trustItems.map((t) => (
                  <div key={t.label} className="bg-card rounded-2xl p-5 border border-border hover:shadow-warm-lg transition-all duration-300 flex flex-col items-center gap-2 text-center">
                    <span className="text-2xl">{t.icon}</span>
                    <span className="font-body text-sm font-semibold text-foreground">{t.label}</span>
                    <span className="font-body text-xs text-muted-foreground leading-relaxed">{t.desc}</span>
                  </div>
                ))}
              </div>
            </AnimatedSection>

            <AnimatedSection delay={0.25}>
              <div className="flex flex-wrap gap-4">
                <Button asChild>
                  <Link to="/for-parents">See How It Works</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/safety-charter">Read Our Safety Charter</Link>
                </Button>
              </div>
            </AnimatedSection>
          </div>
        </div>

        <AnimatedSection delay={0.35}>
          <div className="ai-note mt-12 text-left max-w-2xl mx-auto">
            Yoluno uses AI language models to respond to your child's curiosity in real time. Every response passes through safety filters designed specifically for children. You can review conversation summaries in your Parent Dashboard at any time.
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
