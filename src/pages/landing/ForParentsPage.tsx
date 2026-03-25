import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import AnimatedSection from "@/components/landing/AnimatedSection";

const constraints = {
  never: [
    "Connect to the open internet",
    "Show ads or sponsored content",
    "Monetise children's data — ever",
    "Use behavioural manipulation",
    "Apply social pressure or comparison",
    "Share data with third parties",
    "Prioritise engagement over wellbeing",
  ],
  always: [
    "Respect parent-defined boundaries",
    "Respond gently when boundaries are met",
    "Keep conversations age-appropriate",
    "Give parents full visibility",
    "Put children's wellbeing first",
  ],
};

export default function ForParentsPage() {
  return (
    <main className="pt-20">
      {/* Hero */}
      <section className="section-padding" style={{ background: 'linear-gradient(180deg, #FFFDF7 0%, #E8F8F4 100%)' }}>
        <div className="container max-w-3xl text-center">
          <AnimatedSection>
            <p className="text-label mb-4">For Parents & Educators</p>
            <h1 className="font-heading-landing text-4xl md:text-5xl font-bold text-foreground mb-6">
              You Define the World. Yoluno Respects It.
            </h1>
            <p className="font-body text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto mb-8">
              Every boundary you set is honoured. Every conversation your child has is visible to you. Yoluno is a world where you stay in charge — always.
            </p>
          </AnimatedSection>

          <AnimatedSection delay={0.2}>
            <div className="rounded-3xl overflow-hidden shadow-warm-lg">
              <video
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-auto"
              >
                <source src="/videos/lolo-adventure.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* How It Works */}
      <section className="section-padding bg-background">
        <div className="container max-w-4xl">
          <AnimatedSection className="text-center mb-16">
            <h2 className="font-heading-landing text-3xl font-bold text-foreground mb-4">How It Works</h2>
          </AnimatedSection>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: "🏡", title: "Closed Environment", desc: "No open internet. No external links. No user-generated content. Yoluno is a world — not a browser." },
              { icon: "🌿", title: "Responsive & Adaptive", desc: "Built with modern language technology — designed to listen, respond, and adapt within the boundaries you set." },
              { icon: "🔐", title: "Adult-Governed", desc: "You set the topics, tone, and boundaries. Yoluno operates within the world you define." },
            ].map((item, i) => (
              <AnimatedSection key={item.title} delay={i * 0.1}>
                <div className="bg-card rounded-2xl p-8 shadow-warm text-center h-full">
                  <div className="text-4xl mb-4">{item.icon}</div>
                  <h3 className="font-heading-landing text-lg font-bold text-foreground mb-3">{item.title}</h3>
                  <p className="font-body text-muted-foreground">{item.desc}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Librarian Metaphor */}
      <section className="section-padding bg-linen">
        <div className="container max-w-3xl">
          <AnimatedSection>
            <blockquote className="bg-card rounded-2xl p-10 shadow-warm text-center">
              <p className="font-heading-landing text-xl md:text-2xl text-foreground italic leading-relaxed">
                "Think of it as a thoughtful librarian inside a private library — one that only contains books you've approved, and knows how to speak kindly to every child."
              </p>
            </blockquote>
          </AnimatedSection>
        </div>
      </section>

      {/* Boundary Handling */}
      <section className="section-padding bg-background">
        <div className="container max-w-3xl">
          <AnimatedSection className="text-center mb-12">
            <h2 className="font-heading-landing text-3xl font-bold text-foreground mb-4">
              When Curiosity Crosses a Boundary
            </h2>
          </AnimatedSection>
          <AnimatedSection>
            <div className="space-y-6">
              {[
                { step: "1", text: "Yoluno does not answer — it pauses." },
                { step: "2", text: "It gently redirects toward something safe and engaging." },
                { step: "3", text: "It keeps the tone calm, warm, and reassuring." },
              ].map((s) => (
                <div key={s.step} className="flex items-start gap-4 bg-card rounded-2xl p-6 shadow-warm-sm">
                  <span className="flex-shrink-0 w-10 h-10 bg-primary rounded-full flex items-center justify-center font-heading-landing font-bold text-primary-foreground">
                    {s.step}
                  </span>
                  <p className="font-body text-foreground text-lg">{s.text}</p>
                </div>
              ))}
            </div>
            <p className="font-heading-landing text-center text-lg text-foreground italic mt-8">
              No fear. No exposure. No shame.
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* Insight Not Oversight */}
      <section className="section-padding bg-linen">
        <div className="container max-w-3xl text-center">
          <AnimatedSection>
            <h2 className="font-heading-landing text-3xl font-bold text-foreground mb-6">
              Insight, Not Oversight
            </h2>
            <p className="font-body text-lg text-muted-foreground leading-relaxed mb-4">
              Review conversations. See themes. Understand patterns. Know what your child is curious about — without hovering.
            </p>
            <p className="font-heading-landing text-foreground italic text-lg">
              "This isn't monitoring. It's awareness."
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* Design Constraints */}
      <section className="section-padding bg-background">
        <div className="container max-w-4xl">
          <AnimatedSection className="text-center mb-12">
            <h2 className="font-heading-landing text-3xl font-bold text-foreground mb-4">
              Design Constraints — Not Promises
            </h2>
          </AnimatedSection>
          <AnimatedSection>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-card rounded-2xl p-8 shadow-warm">
                <h3 className="font-heading-landing text-lg font-bold text-foreground mb-6">What Yoluno Never Does</h3>
                <ul className="space-y-3">
                  {constraints.never.map((item) => (
                    <li key={item} className="flex items-start gap-3 font-body text-muted-foreground">
                      <span className="text-destructive font-bold mt-0.5">✕</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-card rounded-2xl p-8 shadow-warm">
                <h3 className="font-heading-landing text-lg font-bold text-foreground mb-6">What Yoluno Always Does</h3>
                <ul className="space-y-3">
                  {constraints.always.map((item) => (
                    <li key={item} className="flex items-start gap-3 font-body text-muted-foreground">
                      <span className="text-primary font-bold mt-0.5">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Schools */}
      <section className="section-padding bg-linen">
        <div className="container max-w-3xl text-center">
          <AnimatedSection>
            <h2 className="font-heading-landing text-3xl font-bold text-foreground mb-6">
              For Schools & Educators
            </h2>
            <p className="font-body text-lg text-muted-foreground leading-relaxed mb-8">
              Curriculum-friendly. Classroom-ready. No screen overload. Yoluno works alongside education, not against it.
            </p>
            <Button size="lg" asChild>
              <a href="mailto:hello@yoluno.com">Talk to Us About School Licensing</a>
            </Button>
          </AnimatedSection>
        </div>
      </section>

      {/* Final CTA */}
      <section className="section-padding bg-background text-center">
        <div className="container max-w-2xl">
          <AnimatedSection>
            <h2 className="font-heading-landing text-3xl font-bold text-foreground mb-4">
              A Thoughtful Way for Children to Explore
            </h2>
            <p className="font-body text-muted-foreground text-lg mb-8">
              When you're ready, Yoluno is here.
            </p>
            <Button size="lg" asChild>
              <Link to="/signup">Start Free Trial</Link>
            </Button>
            <p className="font-body text-stone text-sm mt-4">No credit card required</p>
          </AnimatedSection>
        </div>
      </section>
    </main>
  );
}
