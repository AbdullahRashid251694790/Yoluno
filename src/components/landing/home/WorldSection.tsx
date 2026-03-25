import { Link } from "react-router-dom";
import AnimatedSection from "@/components/landing/AnimatedSection";
import worldImg from "@/assets/landing/world-of-yoluno.png";
import chatIslandImg from "@/assets/landing/island-chat.png";
import storiesIslandImg from "@/assets/landing/island-stories.png";
import journeysIslandImg from "@/assets/landing/island-journeys.png";
import familyIslandImg from "@/assets/landing/island-family.png";

const islands = [
  {
    title: "Chat Island",
    subtitle: "The Thinking Meadow",
    tagline: "Where questions begin — under a tree full of light",
    img: chatIslandImg,
    color: "border-luno",
    bgClass: "from-[hsl(174_50%_94%)] to-[hsl(174_40%_98%)]",
    link: "/features#chat",
  },
  {
    title: "Stories Island",
    subtitle: "The Dreaming Forest",
    tagline: "Where imagination glows and stories grow from branches",
    img: storiesIslandImg,
    color: "border-lumi",
    bgClass: "from-[hsl(270_40%_94%)] to-[hsl(270_30%_98%)]",
    link: "/features#stories",
  },
  {
    title: "Journeys Island",
    subtitle: "The Growing Trail",
    tagline: "Where small steps become big adventures",
    img: journeysIslandImg,
    color: "border-lolo",
    bgClass: "from-[hsl(30_50%_94%)] to-[hsl(30_40%_98%)]",
    link: "/features#journeys",
  },
  {
    title: "Family Island",
    subtitle: "The Memory Garden",
    tagline: "Where your family's stories stay alive",
    img: familyIslandImg,
    color: "border-lala",
    bgClass: "from-[hsl(145_40%_94%)] to-[hsl(145_30%_98%)]",
    link: "/features#family",
  },
];

export default function WorldSection() {
  return (
    <section className="section-padding grain-overlay bg-background">
      <div className="container">
        <AnimatedSection className="text-center mb-12">
          <p className="text-label mb-3">🌍 Explore</p>
          <h2 className="font-heading-landing text-3xl md:text-[38px] font-bold text-foreground mb-4">
            Welcome to YoLuno's World
          </h2>
          <p className="font-body text-muted-foreground text-lg max-w-2xl mx-auto">
            Four detailed worlds, one shared adventure.
          </p>
        </AnimatedSection>

        <AnimatedSection>
          <div className="rounded-3xl overflow-hidden shadow-warm">
            <img
              src={worldImg}
              alt="The World of YoLuno — four floating islands"
              className="w-full h-auto"
              loading="lazy"
            />
          </div>
        </AnimatedSection>

        {/* Island Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
          {islands.map((island, i) => (
            <AnimatedSection key={island.title} delay={i * 0.1}>
              <Link to={island.link} className="block group">
                <div
                  className={`rounded-2xl overflow-hidden border-2 ${island.color} bg-gradient-to-b ${island.bgClass} shadow-warm hover:shadow-warm-lg transition-all duration-300 hover:-translate-y-2`}
                >
                  <div className="aspect-[16/10] overflow-hidden">
                    <img
                      src={island.img}
                      alt={island.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-5">
                    <h3 className="font-heading-landing text-lg font-bold text-foreground mb-1">{island.title}</h3>
                    <p className="font-body text-sm font-semibold text-muted-foreground mb-1">{island.subtitle}</p>
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
