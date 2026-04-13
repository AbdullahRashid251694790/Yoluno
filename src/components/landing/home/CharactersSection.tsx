import AnimatedSection from "@/components/landing/AnimatedSection";
import lunoImg from "@/assets/landing/luno.png";
import loloImg from "@/assets/landing/lolo.png";
import lumiImg from "@/assets/landing/lumi.png";
import lalaImg from "@/assets/landing/lala.png";

const characters = [
  {
    name: "Luno", img: lunoImg, role: "The Guide",
    color: "hsl(var(--luno))", softBg: "bg-luno-soft", borderColor: "border-luno",
    intro: "Hey! I'm Luno. Ready to explore? Let's go find something new!",
    teaches: "Encourages thinking, asking questions, and exploring ideas",
  },
  {
    name: "Lumi", img: lumiImg, role: "The Dreamer",
    color: "hsl(var(--lumi))", softBg: "bg-lumi-soft", borderColor: "border-lumi",
    intro: "I love quiet moments and big dreams. Ready to make a story?",
    teaches: "Grows your imagination and love of stories",
  },
  {
    name: "Lolo", img: loloImg, role: "The Adventurer",
    color: "hsl(var(--lolo))", softBg: "bg-lolo-soft", borderColor: "border-lolo",
    intro: "I'm ready for a challenge! Let's see what we can do together.",
    teaches: "Builds confidence, resilience, and problem-solving",
  },
  {
    name: "Loti", img: lalaImg, role: "The Keeper",
    color: "hsl(var(--lala))", softBg: "bg-lala-soft", borderColor: "border-lala",
    intro: "This is where your family's stories live. Come visit anytime!",
    teaches: "Strengthens family bonds and emotional awareness",
  },
];

export default function CharactersSection() {
  return (
    <section className="section-padding child-world-gradient">
      <div className="container">
        <AnimatedSection className="text-center mb-16">
          <p className="text-label mb-3">Meet the Guides</p>
          <h2 className="font-heading text-3xl md:text-[40px] text-foreground mb-4">
            Four Guides, Each Here to Help Your Child Grow
          </h2>
          <p className="font-body text-muted-foreground text-[17px] max-w-[560px] mx-auto">
            Designed for ages 3 to 14. Younger children explore with voice and pictures. Older children read, write, and think deeper. Every experience adapts.
          </p>
        </AnimatedSection>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {characters.map((char, i) => (
            <AnimatedSection key={char.name} delay={i * 0.1}>
              <div
                className={`bg-card rounded-2xl p-8 text-center h-full flex flex-col items-center border border-border hover:shadow-warm-lg transition-all duration-300 hover:-translate-y-1`}
                style={{ borderTop: `3px solid ${char.color}` }}
              >
                <img src={char.img} alt={char.name} className="w-32 h-32 object-contain mb-4 character-bloom" />
                <h3 className="font-heading text-lg text-foreground">{char.name}</h3>
                <p className="text-label text-xs mt-1 mb-3">{char.role}</p>
                
                <div className={`rounded-xl p-4 w-full mb-3 ${char.softBg}`}>
                  <p className="font-body text-sm text-foreground italic leading-relaxed">"{char.intro}"</p>
                </div>

                <div className="mt-auto pt-2 w-full">
                  <p
                    className="font-body text-xs font-medium leading-relaxed rounded-lg px-3 py-2"
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
