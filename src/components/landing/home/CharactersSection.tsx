import AnimatedSection from "@/components/landing/AnimatedSection";
import lunoImg from "@/assets/landing/luno.png";
import loloImg from "@/assets/landing/lolo.png";
import lumiImg from "@/assets/landing/lumi.png";
import lotiImg from "@/assets/landing/loti.png";

const characters = [
  {
    name: "Luno", emoji: "💙", img: lunoImg, role: "The Guide",
    color: "hsl(var(--luno))",
    intro: "Yo! I'm Luno. I'm your guide! Let's find something new together.",
    teaches: "Helps you think, ask questions, and explore ideas",
  },
  {
    name: "Lumi", emoji: "💜", img: lumiImg, role: "The Dreamer",
    color: "hsl(var(--lumi))",
    intro: "I love quiet moments and big dreams. Ready to make a story?",
    teaches: "Grows your imagination and love of stories",
  },
  {
    name: "Lolo", emoji: "🧡", img: loloImg, role: "The Adventurer",
    color: "hsl(var(--lolo))",
    intro: "I'm ready for a challenge! I'll be your biggest cheerleader.",
    teaches: "Builds confidence, resilience, and problem-solving",
  },
  {
    name: "Loti", emoji: "💛", img: lotiImg, role: "The Keeper",
    color: "hsl(var(--lala))",
    intro: "I keep your family stories safe. You're always welcome here.",
    teaches: "Strengthens family bonds and emotional awareness",
  },
];

export default function CharactersSection() {
  return (
    <section className="section-padding">
      <div className="container">
        <AnimatedSection className="text-center mb-16">
          <p className="text-label mb-3">🌟 Meet Your Best Friends</p>
          <h2 className="font-heading-landing text-3xl md:text-[38px] font-bold text-foreground mb-4">
            Your Guides Are Waiting
          </h2>
          <p className="font-body text-muted-foreground text-lg max-w-xl mx-auto">
            Four friends who each help you grow in different ways.
          </p>
        </AnimatedSection>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {characters.map((char, i) => (
            <AnimatedSection key={char.name} delay={i * 0.1}>
              <div
                className="glass-card rounded-3xl p-8 text-center h-full flex flex-col items-center relative overflow-hidden"
                style={{ borderTop: `4px solid ${char.color}` }}
              >
                {/* Character glow */}
                <div
                  className="absolute top-8 left-1/2 -translate-x-1/2 w-40 h-40 rounded-full pointer-events-none"
                  style={{ background: `radial-gradient(circle, ${char.color}15 0%, transparent 70%)` }}
                />
                <img src={char.img} alt={char.name} className="w-[180px] h-[180px] object-contain mb-4 relative z-10 character-bloom" />
                <h3 className="font-heading-landing text-lg font-bold text-foreground">{char.name} {char.emoji}</h3>
                <p className="text-label text-xs mt-1 mb-3">{char.role}</p>
                
                {/* Speech bubble */}
                <div
                  className="rounded-2xl p-4 w-full mb-3"
                  style={{ backgroundColor: `${char.color}08` }}
                >
                  <p className="font-body text-sm text-text-body italic leading-relaxed">"{char.intro}"</p>
                </div>

                {/* What they teach */}
                <div className="mt-auto pt-2 w-full">
                  <p
                    className="font-body text-xs font-bold leading-relaxed rounded-xl px-3 py-2"
                    style={{ color: char.color, backgroundColor: `${char.color}10` }}
                  >
                    🌱 {char.teaches}
                  </p>
                </div>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}
