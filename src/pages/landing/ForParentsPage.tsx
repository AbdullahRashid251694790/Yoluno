import { Link } from "react-router-dom";
import PageCTA from "@/components/landing/PageCTA";
import { Button } from "@/components/ui/button";
import { MessageCircle, Shield, Eye, ChevronRight } from "lucide-react";
import AnimatedSection from "@/components/landing/AnimatedSection";
import parentDashboardImg from "@/assets/landing/parent-dashboard-forparents.png";
import walledGardenImg from "@/assets/landing/walled-garden.png";
import safetyLunoChatImg from "@/assets/landing/safety-luno-chat.png";

const designedAgainst = [
  "No connection to the open internet — there is no pathway in or out",
  "No ads, sponsored content, or third-party commercial relationships",
  "Children's conversation data is never sold, shared, or used to train external AI models",
  "No engagement-maximising patterns — no streaks, no infinite scroll, no dark patterns",
  "No social features, comparison, or peer pressure mechanics",
];

const alwaysOn = [
  "Parent-defined boundaries enforced at the system level",
  "Gentle, calm redirection when a boundary is reached",
  "Age-appropriate language, tone, and content in every response",
  "Full conversation visibility for parents",
  "Child wellbeing as the primary design metric — measured by session length, redirection frequency, and parent satisfaction",
  "Works in 20+ languages with consistent safety across every one",
];

export default function ForParentsPage() {
  return (
    <main className="pt-20">
      {/* Hero */}
      <section className="section-padding bg-background">
        <div className="container max-w-3xl text-center">
          <AnimatedSection>
            <p className="text-label mb-4">For Parents & Educators</p>
            <h1 className="font-heading text-4xl md:text-[48px] text-foreground mb-6">
              You Define the World. Yoluno Respects It.
            </h1>
            <p className="font-body text-[17px] text-muted-foreground leading-relaxed max-w-[560px] mx-auto mb-8">
              You set the boundaries. You review conversations. You control what stays and what's deleted. Yoluno is built to keep you informed and in charge. For children ages 3 to 14.
            </p>
          </AnimatedSection>

          <AnimatedSection delay={0.2}>
            <div className="rounded-2xl overflow-hidden shadow-warm border border-border">
              <video autoPlay loop muted playsInline className="w-full h-auto">
                <source src="/videos/lolo-adventure.mp4" type="video/mp4" />
              </video>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* How It Works */}
      <section className="section-padding bg-background">
        <div className="container max-w-5xl">
          <AnimatedSection className="text-center mb-16">
            <h2 className="font-heading text-3xl text-foreground mb-4">How It Works</h2>
          </AnimatedSection>

          <div className="grid md:grid-cols-3 gap-0 items-stretch mb-12">
            {[
              {
                num: "1",
                icon: MessageCircle,
                color: "bg-primary text-primary-foreground",
                title: "Your child asks, creates, or explores",
                desc: "They ask Luno about volcanoes. They build a story with Lumi. They take on a challenge with Lolo. They listen to family stories and pictures with Loti. Every interaction is AI-guided, safety-filtered, and adapted to their age. In English, Arabic, French, Chinese, and 20+ more languages.",
              },
              {
                num: "2",
                icon: Shield,
                color: "bg-[#7C6FAE] text-white",
                title: "Yoluno responds — within your boundaries",
                desc: "The AI follows the rules you've set. Topics you've turned off stay off. If curiosity crosses a boundary, Yoluno pauses and gently redirects. For school topics, Luno draws from the English National Curriculum — Key Stage 1 through Key Stage 4 — so your child's curiosity and their classroom learning reinforce each other.",
              },
              {
                num: "3",
                icon: Eye,
                color: "bg-[#E8B630] text-white",
                title: "You see it all in your Parent Dashboard",
                desc: "Your Parent Dashboard shows conversation summaries, topics explored, time spent, and anything that was flagged or redirected. You choose how closely you follow along.",
              },
            ].map((step, i) => (
              <AnimatedSection key={step.num} delay={i * 0.1}>
                <div className="flex items-stretch h-full">
                  <div className="bg-card rounded-2xl p-8 border border-border h-full flex flex-col">
                    <div className={`w-12 h-12 rounded-full ${step.color} flex items-center justify-center mb-5`}>
                      <step.icon size={22} />
                    </div>
                    <h3 className="font-heading text-[16px] font-semibold text-foreground mb-3">{step.title}</h3>
                    <p className="font-body text-[14.5px] text-muted-foreground leading-relaxed">{step.desc}</p>
                  </div>
                  {i < 2 && (
                    <div className="hidden md:flex items-center justify-center px-2 text-muted-foreground/40">
                      <ChevronRight size={28} />
                    </div>
                  )}
                </div>
              </AnimatedSection>
            ))}
          </div>

          <AnimatedSection delay={0.3}>
            <div className="rounded-2xl overflow-hidden shadow-warm border border-border mb-8">
              <img src={parentDashboardImg} alt="Yoluno Parent Dashboard" className="w-full h-auto" loading="lazy" />
            </div>
          </AnimatedSection>

          <AnimatedSection delay={0.4}>
            <div className="bg-secondary rounded-xl p-6 border-l-[3px] border-primary">
              <p className="font-body text-[14px] text-muted-foreground leading-relaxed">
                Yoluno uses AI language models designed specifically for children. Every response is safety-filtered before your child sees it. The AI does not access the internet and cannot operate outside Yoluno's closed world. Responds in your child's language. Over 20 languages supported — including English, Arabic, French, and Chinese — each with full safety filtering and parent visibility. You can see exactly which curriculum topics your child has explored in the Parent Dashboard.
              </p>
            </div>
          </AnimatedSection>
        </div>
      </section>


      {/* Librarian Metaphor */}
      <section className="section-padding bg-secondary relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <img src={walledGardenImg} alt="" className="absolute right-0 top-1/2 -translate-y-1/2 h-full w-auto object-contain opacity-[0.2]" />
        </div>
        <div className="container max-w-5xl relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <AnimatedSection>
              <blockquote className="bg-card/90 backdrop-blur-sm rounded-2xl p-10 border border-border shadow-warm">
                <p className="font-heading text-xl md:text-2xl text-foreground leading-relaxed">
                  Think of Yoluno as a knowledgeable tutor inside a walled garden — one where you set the rules, the AI follows them, and nothing from the outside gets in. The tutor can surprise your child with new ideas, but never with anything outside the boundaries you've defined.
                </p>
              </blockquote>
            </AnimatedSection>
            <div></div>
          </div>
        </div>
      </section>

      {/* Boundary Handling */}
      <section className="section-padding bg-secondary">
        <div className="container max-w-5xl">
          <AnimatedSection className="text-center mb-12">
            <h2 className="font-heading text-3xl text-foreground mb-4">
              When Curiosity Crosses a Boundary
            </h2>
          </AnimatedSection>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <AnimatedSection>
              <div className="rounded-2xl overflow-hidden shadow-warm border border-border">
                <img src={safetyLunoChatImg} alt="Yoluno Safety & Luno Chat settings dashboard" className="w-full h-auto" loading="lazy" />
              </div>
            </AnimatedSection>
            <AnimatedSection delay={0.15}>
              <div className="space-y-4">
                {[
                  { step: "1", text: "Yoluno does not answer — it pauses." },
                  { step: "2", text: "It gently redirects toward something safe and engaging." },
                  { step: "3", text: "It keeps the tone calm, warm, and reassuring." },
                  { step: "4", text: "You're notified in your Parent Dashboard so you can follow up if you'd like." },
                ].map((s) => (
                  <div key={s.step} className="flex items-start gap-4 bg-card rounded-2xl p-6 border border-border">
                    <span className="flex-shrink-0 w-10 h-10 bg-primary rounded-full flex items-center justify-center font-body font-semibold text-primary-foreground">
                      {s.step}
                    </span>
                    <p className="font-body text-foreground text-[17px]">{s.text}</p>
                  </div>
                ))}
              </div>
              <p className="font-heading text-center text-lg text-foreground italic mt-8">
                No shame. No panic. Just a gentle boundary, and a parent who knows.
              </p>
            </AnimatedSection>
          </div>
        </div>
      </section>


      {/* Design Constraints */}
      <section className="section-padding bg-secondary">
        <div className="container max-w-4xl">
          <AnimatedSection className="text-center mb-12">
            <h2 className="font-heading text-3xl text-foreground mb-4">
              Design Constraints — Not Promises
            </h2>
            <p className="font-body text-[17px] text-muted-foreground leading-relaxed max-w-[560px] mx-auto">
              These aren't aspirations — they're architectural decisions baked into how Yoluno works.
            </p>
          </AnimatedSection>
          <AnimatedSection>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-card rounded-2xl p-8 border border-border">
                <h3 className="font-heading text-lg text-foreground mb-6">What We've Designed Against</h3>
                <ul className="space-y-3">
                  {designedAgainst.map((item) => (
                    <li key={item} className="flex items-start gap-3 font-body text-muted-foreground">
                      <span className="text-destructive font-semibold mt-0.5">✕</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-card rounded-2xl p-8 border border-border">
                <h3 className="font-heading text-lg text-foreground mb-6">What's Always On</h3>
                <ul className="space-y-3">
                  {alwaysOn.map((item) => (
                    <li key={item} className="flex items-start gap-3 font-body text-muted-foreground">
                      <span className="text-primary font-semibold mt-0.5">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Your Data, Your Control */}
      <section className="section-padding bg-background">
        <div className="container max-w-3xl">
          <AnimatedSection className="text-center mb-10">
            <h2 className="font-heading text-3xl text-foreground mb-4">
              Your Data, Your Control
            </h2>
            <p className="font-body text-[17px] text-muted-foreground leading-relaxed max-w-[560px] mx-auto">
              We store what's needed to make Yoluno work — and nothing more.
            </p>
          </AnimatedSection>

          <div className="space-y-4">
            {[
              { title: "Conversations", desc: "Your child's conversations are stored so that learning can build over time. You can view, download, or delete any conversation at any time. You can also set conversations to auto-delete after 30, 60, or 90 days." },
              { title: "Family Memories", desc: "Photos, voice recordings, and stories are stored securely and encrypted. Only your family can access them. Deletion is permanent and immediate. We don't keep copies." },
              { title: "Account Deletion", desc: "If you delete your child's account, all associated data is permanently removed within 30 days. You can export everything before deletion." },
            ].map((item, i) => (
              <AnimatedSection key={item.title} delay={i * 0.1}>
                <div className="bg-card rounded-2xl p-8 border border-border">
                  <h3 className="font-heading text-lg text-foreground mb-3">{item.title}</h3>
                  <p className="font-body text-muted-foreground leading-[1.7]">{item.desc}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>

          <AnimatedSection delay={0.3} className="text-center mt-8">
            <a href="/data-practices" className="font-body font-semibold text-primary hover:underline text-[17px]">
              Read our full Data Practices page →
            </a>
          </AnimatedSection>
        </div>
      </section>

      {/* Built With Care */}
      <section className="section-padding bg-secondary">
        <div className="container max-w-3xl">
          <AnimatedSection>
            <h2 className="font-heading text-3xl text-foreground mb-6 text-center">
              Built With Care — and Growing Our Expertise
            </h2>
            <div className="space-y-4 font-body text-[17px] text-muted-foreground leading-[1.7]">
              <p>
                Yoluno's safety systems are built on established child development principles and current best practices in AI safety for children.
              </p>
              <p>
                We're currently forming a <strong className="text-foreground">Child Safety Advisory Board</strong> to provide independent oversight. If you're a child psychologist, educator, or researcher interested in joining, we'd welcome your perspective.
              </p>
              <p>
                <a href="mailto:advisory@yoluno.com" className="font-semibold text-primary hover:underline">Get in touch → advisory@yoluno.com</a>
              </p>
            </div>
          </AnimatedSection>
        </div>
      </section>


      {/* Schools */}
      <section className="section-padding bg-secondary">
        <div className="container max-w-3xl text-center">
          <AnimatedSection>
            <h2 className="font-heading text-3xl text-foreground mb-6">
              For Schools & Educators
            </h2>
            <p className="font-body text-[17px] text-muted-foreground leading-relaxed mb-4 max-w-[560px] mx-auto">
              Yoluno can support classroom learning with AI-guided conversation aligned to the English National Curriculum.
            </p>
            <p className="font-body text-[17px] text-muted-foreground leading-relaxed mb-8 max-w-[560px] mx-auto">
              We're currently working with a small number of schools. If you're interested in a pilot, we'd love to hear from you.
            </p>
            <Button size="lg">Talk to Us About School Licensing →</Button>
          </AnimatedSection>
        </div>
      </section>

      <PageCTA
        heading="You've read how it works. Now see it with your own child."
        subtitle="Full Parent Dashboard access from day one. Set the boundaries before your child even starts."
      />
    </main>
  );
}
