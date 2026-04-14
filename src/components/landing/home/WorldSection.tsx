import { Link } from "react-router-dom";
import AnimatedSection from "@/components/landing/AnimatedSection";
import worldImg from "@/assets/landing/world-of-yoluno.png";
import chatIslandImg from "@/assets/landing/island-chat.png";
import storiesIslandImg from "@/assets/landing/island-stories.png";
import journeysIslandImg from "@/assets/landing/island-journeys-thumb.png";
import familyIslandImg from "@/assets/landing/island-family-thumb.png";

const islands = [
  {
    title: "Chat", subtitle: "Curiosity & Conversation",
    tagline: "Where questions begin — with the English National Curriculum built in.",
    img: chatIslandImg, accent: "border-t-luno",
    link: "/features#chat",
  },
  {
    title: "Stories", subtitle: "Imagination & Creativity",
    tagline: "Where imagination leads",
    img: storiesIslandImg, accent: "border-t-lumi",
    link: "/features#stories",
  },
  {
    title: "Journeys", subtitle: "Habits & Gentle Growth",
    tagline: "Where small things grow quietly",
    img: journeysIslandImg, accent: "border-t-lolo",
    link: "/features#journeys",
  },
  {
    title: "Family", subtitle: "Memory & Belonging",
    tagline: "Where your family stays close — even far away",
    img: familyIslandImg, accent: "border-t-lala",
    link: "/features#family",
  },
];

export default function WorldSection() {
  return (
    <section className="section-padding bg-background">
      <div className="container">
        <AnimatedSection className="text-center mb-12">
          <p className="text-label mb-3">Explore</p>
          <h2 className="font-heading text-3xl md:text-[40px] text-foreground mb-4">
            Four Spaces. One World.
          </h2>
          <p className="font-body text-muted-foreground text-[17px] max-w-[560px] mx-auto">
            Each space exists for a different kind of curiosity. Your child moves between them freely — between lessons, after school, or whenever curiosity calls.
          </p>
        </AnimatedSection>

        <AnimatedSection>
          <div className="rounded-2xl overflow-hidden shadow-warm border border-border">
            <img
              src={worldImg}
              alt="The World of Yoluno — four floating islands"
              className="w-full h-auto"
              loading="lazy"
            />
          </div>
        </AnimatedSection>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-12 items-stretch">
          {islands.map((island, i) => (
            <AnimatedSection key={island.title} delay={i * 0.1} className="h-full">
              <Link to={island.link} className="block group h-full">
                <div className={`bg-card rounded-2xl overflow-hidden border border-border ${island.accent} border-t-[3px] shadow-warm hover:shadow-warm-lg transition-all duration-300 hover:-translate-y-1 h-full flex flex-col`}>
                  <div className="aspect-[16/10] overflow-hidden flex-shrink-0">
                    <img
                      src={island.img}
                      alt={island.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-5 flex-1 flex flex-col">
                    <h3 className="font-heading text-lg text-foreground mb-1">{island.title}</h3>
                    <p className="font-body text-sm font-medium text-muted-foreground mb-1">{island.subtitle}</p>
                    <p className="font-body text-sm text-muted-foreground leading-relaxed">{island.tagline}</p>
                  </div>
                </div>
              </Link>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}
