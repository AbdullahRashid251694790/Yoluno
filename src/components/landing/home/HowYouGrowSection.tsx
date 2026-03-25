import AnimatedSection from "@/components/landing/AnimatedSection";
import CloudDivider from "@/components/landing/CloudDivider";

const growthAreas = [
  {
    icon: "🧠",
    title: "Think & Wonder",
    desc: "Ask big questions, explore ideas, and learn how to figure things out — at your own pace.",
    color: "hsl(var(--luno))",
  },
  {
    icon: "🎨",
    title: "Create & Imagine",
    desc: "Tell your own stories, build new worlds, and let your imagination run free.",
    color: "hsl(var(--lumi))",
  },
  {
    icon: "💪",
    title: "Try & Grow",
    desc: "Take on fun challenges, learn from mistakes, and discover what you're capable of.",
    color: "hsl(var(--lolo))",
  },
  {
    icon: "❤️",
    title: "Feel & Connect",
    desc: "Understand your feelings, care for others, and build stronger family bonds.",
    color: "hsl(var(--lala))",
  },
];

export default function HowYouGrowSection() {
  return (
    <>
      <CloudDivider flip />
      <section className="section-padding relative overflow-hidden">
        <div className="container">
          <AnimatedSection className="text-center mb-14">
            <p className="text-label mb-3">🌱 Learning Through Play</p>
            <h2 className="font-heading-landing text-3xl md:text-[38px] font-bold text-foreground mb-4">
              How You'll Grow
            </h2>
            <p className="font-body text-muted-foreground text-lg max-w-2xl mx-auto">
              Every adventure in Yoluno helps you build real skills — not through tests or scores, but through play, stories, and discovery.
            </p>
          </AnimatedSection>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {growthAreas.map((area, i) => (
              <AnimatedSection key={area.title} delay={i * 0.1}>
                <div className="glass-card rounded-3xl p-7 text-center h-full flex flex-col items-center group transition-transform duration-500 hover:-translate-y-1">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-5 transition-transform duration-300 group-hover:scale-110"
                    style={{ backgroundColor: `${area.color}15` }}
                  >
                    {area.icon}
                  </div>
                  <h3
                    className="font-heading-landing text-lg font-bold mb-2"
                    style={{ color: area.color }}
                  >
                    {area.title}
                  </h3>
                  <p className="font-body text-sm text-text-body leading-[1.7]">
                    {area.desc}
                  </p>
                </div>
              </AnimatedSection>
            ))}
          </div>

          {/* Fun fact callout */}
          <AnimatedSection delay={0.5} className="mt-14">
            <div
              className="glass-card rounded-3xl p-8 max-w-3xl mx-auto text-center"
              style={{ borderLeft: '4px solid hsl(var(--luno))' }}
            >
              <p className="font-body text-text-body text-base leading-[1.8]">
                <span className="font-bold" style={{ color: 'hsl(var(--luno))' }}>Did you know?</span> Children learn best when they feel safe, curious, and free to explore. 
                Yoluno is built around this idea — no timers, no scores, just real growth at your child's natural pace. 🌿
              </p>
            </div>
          </AnimatedSection>
        </div>
      </section>
      <CloudDivider />
    </>
  );
}
