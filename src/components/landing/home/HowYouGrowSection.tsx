import AnimatedSection from "@/components/landing/AnimatedSection";

const growthAreas = [
  {
    icon: "🧠", title: "Think & Wonder",
    desc: "Ask big questions, explore ideas, and learn how to figure things out — at your own pace.",
    color: "hsl(var(--luno))",
  },
  {
    icon: "🎨", title: "Create & Imagine",
    desc: "Tell your own stories, build new worlds, and let your imagination run free.",
    color: "hsl(var(--lumi))",
  },
  {
    icon: "💪", title: "Try & Grow",
    desc: "Take on fun challenges, learn from mistakes, and discover what you're capable of.",
    color: "hsl(var(--lolo))",
  },
  {
    icon: "❤️", title: "Feel & Connect",
    desc: "Understand your feelings, care for others, and build stronger family bonds.",
    color: "hsl(var(--lala))",
  },
];

export default function HowYouGrowSection() {
  return (
    <section className="section-padding bg-secondary">
      <div className="container">
        <AnimatedSection className="text-center mb-14">
          <p className="text-label mb-3">Learning Through Play</p>
          <h2 className="font-heading text-3xl md:text-[40px] text-foreground mb-4">
            How Your Child Grows
          </h2>
          <p className="font-body text-muted-foreground text-[17px] max-w-[560px] mx-auto">
            Every adventure in Yoluno helps build real skills — not through tests or scores, but through play, stories, and discovery.
          </p>
        </AnimatedSection>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {growthAreas.map((area, i) => (
            <AnimatedSection key={area.title} delay={i * 0.1}>
              <div className="bg-card rounded-2xl p-7 text-center h-full flex flex-col items-center border border-border hover:shadow-warm-lg transition-all duration-300 hover:-translate-y-1">
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl mb-5"
                  style={{ backgroundColor: `${area.color}12` }}
                >
                  {area.icon}
                </div>
                <h3 className="font-heading text-lg mb-2" style={{ color: area.color }}>
                  {area.title}
                </h3>
                <p className="font-body text-sm text-muted-foreground leading-[1.7]">
                  {area.desc}
                </p>
              </div>
            </AnimatedSection>
          ))}
        </div>

        <AnimatedSection delay={0.5} className="mt-14">
          <div className="ai-note max-w-3xl mx-auto">
            Yoluno is powered by AI designed specifically for children — every response is safety-filtered, age-adapted, and visible to parents in the Parent Dashboard.
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
