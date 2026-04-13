import AnimatedSection from "@/components/landing/AnimatedSection";

const testimonials = [
  { quote: "For the first time, I don't worry when my daughter picks up her tablet. She comes back calmer, with stories to share.", name: "Sarah M.", role: "Parent of a 6-year-old" },
  { quote: "My son started asking me about his grandfather — something he'd never done before. A story in Yoluno sparked the conversation.", name: "David L.", role: "Parent of an 8-year-old" },
  { quote: "It feels like a trusted guide for my child, not another app competing for her attention. That's so rare.", name: "Maria K.", role: "Parent of a 5-year-old" },
];

export default function TestimonialsSection() {
  return (
    <section className="section-padding bg-secondary">
      <div className="container">
        <AnimatedSection className="text-center mb-12">
          <h2 className="font-heading text-3xl md:text-[38px] text-foreground">What Families Say</h2>
        </AnimatedSection>
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {testimonials.map((t, i) => (
            <AnimatedSection key={i} delay={i * 0.1}>
              <div className="bg-card rounded-2xl p-7 border border-border hover:shadow-warm-lg transition-all duration-300 h-full flex flex-col">
                <span className="font-heading text-4xl text-primary/30 leading-none mb-2">"</span>
                <p className="font-body text-foreground italic leading-relaxed flex-1">{t.quote}</p>
                <div className="mt-6 pt-4 border-t border-border">
                  <p className="font-body font-semibold text-foreground text-sm">{t.name}</p>
                  <p className="font-body text-muted-foreground text-xs">{t.role}</p>
                </div>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}
