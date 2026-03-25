import AnimatedSection from "@/components/landing/AnimatedSection";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const sections = [
  {
    title: "Safety & Privacy",
    items: [
      { q: "Is Yoluno connected to the internet?", a: "No. Yoluno is a completely closed world. Children cannot browse the web, access external content, or interact with anyone outside the space." },
      { q: "Does Yoluno collect my child's data?", a: "Yoluno collects only what's needed to provide the experience — and nothing is ever shared with third parties or used for advertising. Ever." },
      { q: "Does Yoluno use AI?", a: "Yoluno uses modern language technology to listen, respond, and adapt to your child — but it's designed to feel like a companion, not a computer. The technology is invisible by design." },
    ],
  },
  {
    title: "How It Works",
    items: [
      { q: "What ages is Yoluno for?", a: "Yoluno is designed for children aged 3–14, with content and interactions that adapt to each child's age and development." },
      { q: "Can multiple children use one account?", a: "Yes! The Yoluno Family plan supports up to 5 individual child profiles, each with their own personalised experience." },
      { q: "How do parents control the experience?", a: "Through the Parent Dashboard, you can set topics, boundaries, tone, review conversations, and see what your child is curious about." },
    ],
  },
  {
    title: "What Children Experience",
    items: [
      { q: "What can my child do in Yoluno?", a: "Children can chat with friendly characters, co-create stories, go on guided journeys, and explore family memories — all in a safe, closed world." },
      { q: "Will my child be talking to a real person?", a: "No. Your child interacts with four carefully designed characters — Luno, Lolo, Lumi, and Lala — each with their own personality and purpose." },
      { q: "What happens if my child asks something inappropriate?", a: "Yoluno pauses, does not answer, and gently redirects toward something safe and engaging. No fear, no exposure, no shame." },
    ],
  },
  {
    title: "For Educators",
    items: [
      { q: "Can Yoluno be used in schools?", a: "Yes. Yoluno is curriculum-friendly and classroom-ready. Contact us for school licensing options." },
      { q: "Does Yoluno replace traditional learning?", a: "No. Yoluno complements education by nurturing curiosity, creativity, and emotional growth — alongside what children learn in school." },
    ],
  },
];

export default function FAQsPage() {
  return (
    <main className="pt-20">
      <section className="section-padding bg-gradient-to-b from-parchment to-background">
        <div className="container max-w-3xl text-center">
          <AnimatedSection>
            <p className="text-label mb-4">FAQs</p>
            <h1 className="font-heading-landing text-4xl md:text-5xl font-bold text-foreground mb-6">
              Questions & Answers
            </h1>
            <p className="font-body text-lg text-muted-foreground">
              Everything you need to know about Yoluno.
            </p>
          </AnimatedSection>
        </div>
      </section>

      <section className="section-padding bg-background">
        <div className="container max-w-2xl space-y-12">
          {sections.map((section, si) => (
            <AnimatedSection key={section.title} delay={si * 0.1}>
              <h2 className="font-heading-landing text-2xl font-bold text-foreground mb-6">{section.title}</h2>
              <Accordion type="single" collapsible className="space-y-3">
                {section.items.map((item, i) => (
                  <AccordionItem key={i} value={`${si}-${i}`} className="bg-card rounded-2xl shadow-warm-sm border-none px-6">
                    <AccordionTrigger className="font-body font-semibold text-foreground text-left hover:no-underline">
                      {item.q}
                    </AccordionTrigger>
                    <AccordionContent className="font-body text-muted-foreground">
                      {item.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </AnimatedSection>
          ))}
        </div>
      </section>
    </main>
  );
}
