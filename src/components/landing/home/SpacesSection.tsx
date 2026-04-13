import AnimatedSection from "@/components/landing/AnimatedSection";
import islandChat from "@/assets/landing/island-chat.png";
import islandStories from "@/assets/landing/island-stories.png";
import islandJourneys from "@/assets/landing/island-journeys.png";
import islandFamily from "@/assets/landing/island-family.png";

const islands = [
  {
    emoji: "💬",
    title: "The Thinking Meadow",
    color: "hsl(var(--luno))",
    glowColor: "rgba(61,214,200,0.2)",
    img: islandChat,
    desc: "Got a big question? This is where we talk and think together. We can play games, solve puzzles, and find answers to all the 'Whys' and 'How-to-dos' you can imagine.",
    skills: ["Curiosity", "Critical Thinking", "Communication"],
  },
  {
    emoji: "📖",
    title: "The Library of Dreams",
    color: "hsl(var(--lumi))",
    glowColor: "rgba(170,130,255,0.2)",
    img: islandStories,
    desc: "Lumi is waiting for you! In this library, the stories haven't been written yet — because you're the storyteller. Choose what happens next and watch the world change around you.",
    skills: ["Storytelling", "Imagination", "Reading"],
  },
  {
    emoji: "🧭",
    title: "Adventure Peak",
    color: "hsl(var(--lolo))",
    glowColor: "rgba(230,130,90,0.2)",
    img: islandJourneys,
    desc: "Lolo is already at the top! Come and join the fun missions. There's no 'game over' here — just new paths to find and cool things to try at your own pace.",
    skills: ["Problem Solving", "Resilience", "Discovery"],
  },
  {
    emoji: "👨‍👩‍👧",
    title: "The Golden Gallery",
    color: "hsl(var(--lala))",
    glowColor: "rgba(212,168,67,0.2)",
    img: islandFamily,
    desc: "Loti keeps the most special things here. Listen to your favorite voices, see photos of the people who love you, and keep your best memories safe in a warm, glowing light.",
    skills: ["Empathy", "Family Bonds", "Emotional Growth"],
  },
];

export default function SpacesSection() {
  return (
    <section className="section-padding relative overflow-hidden">
      <div className="container">
        <AnimatedSection className="text-center mb-16">
          <p className="text-label mb-3">🌈 Choose Your Adventure</p>
          <h2 className="font-heading-landing text-3xl md:text-[38px] font-bold text-foreground mb-4">
            Yoluno's World
          </h2>
          <p className="font-body text-muted-foreground text-lg max-w-xl mx-auto">
            Four floating islands, each with its own guide, magic, and things to learn.
          </p>
        </AnimatedSection>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {islands.map((island, i) => (
            <AnimatedSection key={island.title} delay={i * 0.12}>
              <div
                className="glass-card rounded-3xl p-8 h-full flex flex-col items-center text-center group transition-transform duration-500 hover:-translate-y-2 relative"
              >
                {/* Island bloom glow */}
                <div
                  className="absolute -top-6 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full pointer-events-none opacity-60 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: `radial-gradient(circle, ${island.glowColor} 0%, transparent 70%)` }}
                />

                {/* Island image */}
                <div className="relative z-10 mb-4">
                  <img
                    src={island.img}
                    alt={island.title}
                    className="w-28 h-28 object-contain animate-float drop-shadow-lg"
                    style={{ animationDelay: `${i * 0.3}s` }}
                    loading="lazy"
                  />
                </div>

                {/* Title pill */}
                <span
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-pill text-sm font-bold font-body text-white mb-4 relative z-10"
                  style={{ backgroundColor: island.color }}
                >
                  {island.emoji} {island.title}
                </span>

                <p className="font-body text-text-body leading-[1.7] relative z-10 text-[15px] mb-4">
                  {island.desc}
                </p>

                {/* Learning skill tags */}
                <div className="flex flex-wrap gap-1.5 justify-center mt-auto relative z-10">
                  {island.skills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-body font-bold"
                      style={{
                        backgroundColor: `${island.color}15`,
                        color: island.color,
                        border: `1px solid ${island.color}30`,
                      }}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}
