import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import AnimatedSection from "@/components/landing/AnimatedSection";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const features = [
  "All four spaces — Chat, Stories, Journeys, Family",
  "All four companion characters",
  "Up to 5 child profiles",
  "Verified, curriculum-aligned learning",
  "Co-created stories with voice narration",
  "Gentle journeys and habit-building",
  "Family stories, voice recordings, and photos",
  "Full parent dashboard and visibility",
  "Parent-set boundaries and topic controls",
  "Calm weekly summaries",
  "Age-appropriate content at every level",
  "No ads — now or ever",
  "No data monetisation — ever",
  "Priority support",
];

const faqs = [
  { q: "Why do you charge at all?", a: "Free products often come with hidden costs — ads, data collection, attention manipulation, or content designed to keep children watching rather than learning. Yoluno is funded directly by families so we can remain independent, transparent, and focused solely on your child's wellbeing. The price you pay is the reason we never have to compromise." },
  { q: "Why isn't there a free plan?", a: "Because our commitment is to your child, not to advertisers. A free tier would eventually require us to monetise attention, data, or behaviour to sustain the business. We chose a clear, honest price instead — so the product never has to change to serve someone other than your family." },
  { q: "Can I cancel anytime?", a: "Yes. No contracts, no cancellation fees, no hoops to jump through. If Yoluno isn't right for your family, you can cancel in two clicks from your dashboard." },
  { q: "What happens after the free trial?", a: "If you love it, choose monthly or annual. If not, your account simply pauses — no charge, no pressure. Your child's stories and memories are kept safe for 90 days in case you decide to return." },
  { q: "Do you offer family discounts?", a: "The Yoluno Family plan already includes up to 5 child profiles — so the whole family is covered. For larger families, reach out and we'll find a solution." },
];

export default function PricingPage() {
  const [annual, setAnnual] = useState(true);

  return (
    <main className="pt-20">
      <section className="section-padding" style={{ background: 'linear-gradient(180deg, #FFFDF7 0%, #E8F8F4 100%)' }}>
        <div className="container max-w-3xl text-center">
          <AnimatedSection>
            <p className="text-label mb-4">Pricing</p>
            <h1 className="font-heading-landing text-4xl md:text-5xl font-bold text-foreground mb-6">
              Simple, Honest Pricing — Built for Families.
            </h1>
            <p className="font-body text-lg text-muted-foreground">
              One plan. Everything included. No ads, no tricks, no surprise upgrades.
            </p>
          </AnimatedSection>
        </div>
      </section>

      <section className="section-padding bg-background">
        <div className="container max-w-lg">
          <AnimatedSection>
            {/* Toggle */}
            <div className="flex items-center justify-center gap-4 mb-10">
              <button
                onClick={() => setAnnual(false)}
                className={`font-body font-semibold text-sm px-4 py-2 rounded-pill transition-all ${!annual ? "bg-foreground text-background" : "text-muted-foreground"}`}
              >
                Monthly
              </button>
              <button
                onClick={() => setAnnual(true)}
                className={`font-body font-semibold text-sm px-4 py-2 rounded-pill transition-all ${annual ? "bg-foreground text-background" : "text-muted-foreground"}`}
              >
                Annual
                <span className="ml-2 text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-pill">Save 34%</span>
              </button>
            </div>

            {/* Plan Card */}
            <div className="bg-card rounded-2xl p-10 shadow-warm-lg border-2 border-primary text-center">
              <h3 className="font-heading-landing text-2xl font-bold text-foreground mb-2">💛 Yoluno Family</h3>
              <p className="font-body text-muted-foreground mb-6">Up to 5 child profiles</p>

              <div className="mb-6">
                <span className="font-heading-landing text-5xl font-bold text-foreground">
                  {annual ? "$79" : "$9.99"}
                </span>
                <span className="font-body text-muted-foreground ml-2">
                  {annual ? "/year" : "/month"}
                </span>
                {annual && (
                  <p className="font-body text-sm text-muted-foreground mt-2">
                    That's less than $6.60/month — less than two picture books.
                  </p>
                )}
              </div>

              <Button size="lg" className="w-full mb-4" asChild>
                <Link to="/signup">Start 14-Day Free Trial</Link>
              </Button>
              <p className="font-body text-muted-foreground text-sm">No credit card required</p>

              <div className="mt-8 pt-6 border-t border-border text-left">
                <ul className="space-y-3">
                  {features.map((f) => (
                    <li key={f} className="flex items-center gap-3 font-body text-foreground text-sm">
                      <span className="text-primary font-bold">✓</span> {f}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-6 bg-secondary rounded-xl p-4">
                <p className="font-body text-sm text-foreground font-semibold">💛 30-Day Satisfaction Guarantee</p>
                <p className="font-body text-xs text-muted-foreground mt-1">
                  If Yoluno isn't right for your family, we'll refund you fully. No questions.
                </p>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Why we price this way */}
      <section className="section-padding bg-linen">
        <div className="container max-w-2xl">
          <AnimatedSection className="mb-8 text-center">
            <h2 className="font-heading-landing text-2xl font-bold text-foreground">Why We Price This Way</h2>
          </AnimatedSection>
          <AnimatedSection>
            <Accordion type="single" collapsible className="space-y-3">
              {faqs.map((faq, i) => (
                <AccordionItem key={i} value={`faq-${i}`} className="bg-card rounded-2xl shadow-warm-sm border-none px-6">
                  <AccordionTrigger className="font-body font-semibold text-foreground text-left hover:no-underline">
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
      <section className="section-padding bg-background text-center">
        <div className="container max-w-2xl">
          <AnimatedSection>
            <h2 className="font-heading-landing text-2xl font-bold text-foreground mb-4">For Schools & Classrooms</h2>
            <p className="font-body text-muted-foreground mb-6">
              We offer flexible licensing for schools, districts, and educational organisations — including teacher dashboards, session controls, curriculum alignment, and dedicated onboarding.
            </p>
            <Button variant="gold" size="lg" className="mb-3" asChild>
              <a href="mailto:hello@yoluno.com">Contact Us About School Licensing</a>
            </Button>
            <p className="font-body text-sm text-muted-foreground">hello@yoluno.com</p>
          </AnimatedSection>
        </div>
      </section>

      {/* Trust Signals */}
      <section className="py-12 bg-linen">
        <div className="container max-w-3xl">
          <AnimatedSection>
            <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12 text-center">
              <div className="font-body text-foreground font-semibold text-sm">
                🔒 Encrypted end-to-end
              </div>
              <div className="font-body text-foreground font-semibold text-sm">
                🚫 No ads or tracking — ever
              </div>
              <div className="font-body text-foreground font-semibold text-sm">
                💛 Cancel anytime, hassle-free
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Final CTA */}
      <section className="section-padding bg-background text-center">
        <div className="container max-w-2xl">
          <AnimatedSection>
            <h2 className="font-heading-landing text-2xl md:text-3xl font-bold text-foreground mb-6">
              A calmer way for your child to explore and learn.
            </h2>
            <Button size="lg" className="mb-3" asChild>
              <Link to="/signup">Start Free Trial</Link>
            </Button>
            <p className="font-body text-sm text-muted-foreground">No credit card required</p>
          </AnimatedSection>
        </div>
      </section>
    </main>
  );
}
