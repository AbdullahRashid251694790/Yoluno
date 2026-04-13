import { useState } from "react";
import { Link } from "react-router-dom";
import PageCTA from "@/components/landing/PageCTA";
import { Button } from "@/components/ui/button";
import AnimatedSection from "@/components/landing/AnimatedSection";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const features = [
  "All four spaces — Chat, Stories, Journeys, Family",
  "Up to 5 child profiles, each with personalised AI adaptation",
  "English National Curriculum built in — KS1 through KS4",
  "Co-created stories with AI narration",
  "Gentle growth journeys and habit-building prompts",
  "Family memories — voice recordings, photos, and stories (parent-managed)",
  "Full Parent Dashboard — conversation logs, themes, and activity summaries",
  "Parent-set boundaries, topic controls, and content flags",
  "Calm weekly summary emails",
  "Age-appropriate AI responses at every level (ages 3–14)",
  "Available in 20+ languages — English, Arabic, French, Chinese, and more",
  "No ads — ever",
  "Children's data is never sold or shared with third parties",
  "Priority support",
];

const profilePoints = [
  { bold: "Own conversation history", rest: " — what one child explores doesn't appear in another's space." },
  { bold: "Own age calibration", rest: " — a 6-year-old and an 11-year-old get entirely different experiences." },
  { bold: "Own boundaries", rest: " — you can set different topic controls for each child." },
  { bold: "Own progress", rest: " — Journeys, stories, and learning all track separately." },
];

const faqs = [
  { q: "Why do you charge at all?", a: "Because charging families directly means we never need to monetise your child's attention or data. No ads, no data deals. The price is what keeps Yoluno safe." },
  { q: "Why isn't there a free plan?", a: "A free plan would mean compromising on privacy, data, or quality. We'd rather offer a generous trial and let you decide." },
  { q: "Can I cancel anytime?", a: "Yes. Cancel from your Parent Dashboard at any time. Annual plans: access continues until billing period ends. First 30 days: full refund." },
  { q: "What happens after the free trial?", a: "If you don't subscribe, your account remains accessible in read-only mode for 30 days so you can export data. After that, data is permanently deleted." },
  { q: "Do you offer reduced pricing?", a: "Yes. If cost is a barrier, contact us at hello@yoluno.com. No proof required, no forms to fill." },
  { q: "What languages does Yoluno support?", a: "Yoluno works in over 20 languages including English, Arabic, French, Mandarin Chinese, Italian, Spanish, Hindi, Urdu, German, and Portuguese. Your child can switch languages anytime — the same safety filters, age adaptation, and parent visibility apply in every language. All features including Chat, Stories, Journeys, and Family work across all supported languages." },
  { q: "Which curriculum does Yoluno follow?", a: "The English National Curriculum (British curriculum) is fully built into Yoluno, covering Key Stage 1 through Key Stage 4 across subjects including science, maths, history, geography, English, and computing. Your child gets answers grounded in the same framework their school uses. We're currently developing alignment with additional curricula including the UAE MOE framework and US Common Core — these will be available in future updates." },
];

export default function PricingPage() {
  const [annual, setAnnual] = useState(true);

  return (
    <main className="pt-20">
      {/* Hero */}
      <section className="section-padding pb-8 bg-background">
        <div className="container max-w-3xl text-center">
          <AnimatedSection>
            <p className="text-label mb-4">Pricing</p>
            <h1 className="font-heading text-4xl md:text-[48px] text-foreground mb-6">
              Simple, Honest Pricing — Built for Families.
            </h1>
            <p className="font-body text-[17px] text-muted-foreground mb-6 max-w-[560px] mx-auto">
              One plan. Everything included. No ads, no tricks.
            </p>
            <div className="ai-note max-w-xl mx-auto text-left">
              Yoluno is powered by AI designed specifically for children — safety-filtered, age-adapted, and parent-controlled. Here's what that costs.
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Price Card */}
      <section className="section-padding bg-secondary">
        <div className="container max-w-lg">
          <AnimatedSection>
            <div className="flex items-center justify-center gap-4 mb-10">
              <button
                onClick={() => setAnnual(false)}
                className={`font-body font-medium text-sm px-4 py-2 rounded-pill transition-all ${!annual ? "bg-foreground text-background" : "text-muted-foreground"}`}
              >
                Monthly
              </button>
              <button
                onClick={() => setAnnual(true)}
                className={`font-body font-medium text-sm px-4 py-2 rounded-pill transition-all ${annual ? "bg-foreground text-background" : "text-muted-foreground"}`}
              >
                Annual
                <span className="ml-2 text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-pill">Save 34%</span>
              </button>
            </div>

            <div className="bg-card rounded-2xl p-10 border-2 border-primary text-center shadow-warm-lg">
              <h3 className="font-heading text-2xl text-foreground mb-2">💛 Yoluno Family</h3>
              <p className="font-body text-muted-foreground mb-6">Up to 5 child profiles · Ages 3–14</p>

              {annual ? (
                <div className="mb-6">
                  <span className="font-heading text-5xl text-foreground">$79</span>
                  <span className="font-body text-muted-foreground ml-2">/year</span>
                  <p className="font-body text-sm text-muted-foreground mt-2">$6.58/month, billed annually</p>
                  <p className="font-body text-xs text-primary font-medium mt-1">You save 34% compared to monthly</p>
                </div>
              ) : (
                <div className="mb-6">
                  <span className="font-heading text-5xl text-foreground">$9.99</span>
                  <span className="font-body text-muted-foreground ml-2">/month</span>
                  <p className="font-body text-sm text-muted-foreground mt-2">$119.88 if billed monthly for a year</p>
                  <p className="font-body text-xs text-muted-foreground mt-1">Switch to annual and save 34%</p>
                </div>
              )}

              <p className="font-body text-sm text-muted-foreground mb-6">
                Your 14-day trial includes everything — all four spaces, all features, full Parent Dashboard. No limits, no credit card required.
              </p>

              <Button size="lg" className="w-full mb-8" asChild>
                <Link to="/signup">Start 14-Day Free Trial</Link>
              </Button>

              <div className="pt-6 border-t border-border text-left">
                <ul className="space-y-3">
                  {features.map((f) => (
                    <li key={f} className="flex items-start gap-3 font-body text-foreground text-sm">
                      <span className="text-primary font-semibold mt-0.5">✓</span> {f}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8 bg-secondary rounded-xl p-6 text-left">
                <h4 className="font-heading text-lg text-foreground mb-3">
                  One Family. Up to Five Children. Each One Individual.
                </h4>
                <p className="font-body text-sm text-muted-foreground mb-4">
                  Every child profile is completely independent:
                </p>
                <ul className="space-y-2">
                  {profilePoints.map((point) => (
                    <li key={point.bold} className="font-body text-sm text-foreground">
                      <strong>{point.bold}</strong>{point.rest}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-6 bg-secondary rounded-xl p-4">
                <p className="font-body text-sm text-foreground font-semibold">💛 30-Day Satisfaction Guarantee</p>
                <p className="font-body text-xs text-muted-foreground mt-1">
                  If Yoluno isn't right for your family, full refund — no hassle.
                </p>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Why we price this way */}
      <section className="section-padding bg-background">
        <div className="container max-w-2xl">
          <AnimatedSection className="mb-8 text-center">
            <h2 className="font-heading text-2xl text-foreground">Why We Price This Way</h2>
          </AnimatedSection>
          <AnimatedSection>
            <Accordion type="single" collapsible className="space-y-3">
              {faqs.map((faq, i) => (
                <AccordionItem key={i} value={`faq-${i}`} className="bg-card rounded-2xl border border-border px-6">
                  <AccordionTrigger className="font-body font-medium text-foreground text-left hover:no-underline">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="font-body text-muted-foreground">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </AnimatedSection>
        </div>
      </section>

      {/* Schools CTA */}
      <section className="section-padding bg-secondary text-center">
        <div className="container max-w-2xl">
          <AnimatedSection>
            <h2 className="font-heading text-2xl text-foreground mb-4">For Schools & Classrooms</h2>
            <p className="font-body text-muted-foreground mb-6 max-w-[560px] mx-auto">
              We're building a school-ready version with teacher dashboards and curriculum alignment. If you're an educator interested in early access, we'd love to hear from you.
            </p>
            <Button variant="outline" size="lg" asChild>
              <a href="mailto:hello@yoluno.com">Register Interest →</a>
            </Button>
          </AnimatedSection>
        </div>
      </section>

      {/* Trust Signals */}
      <section className="py-10 bg-card border-y border-border">
        <div className="container max-w-3xl">
          <AnimatedSection>
            <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12 text-center">
              <div className="font-body text-foreground font-medium text-sm">🔒 Data encrypted in transit and at rest</div>
              <div className="font-body text-foreground font-medium text-sm">🚫 No ads, no third-party trackers</div>
              <div className="font-body text-foreground font-medium text-sm">💛 Cancel anytime, hassle-free</div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      <PageCTA
        heading="Less than a streaming subscription. Worth more than any of them."
        subtitle="14 days free. Every feature. If it's not right for your family, you pay nothing."
      />
    </main>
  );
}
