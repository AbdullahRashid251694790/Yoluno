import AnimatedSection from "@/components/landing/AnimatedSection";

const accentColors = ["#3ECDC6", "#B8A5D4", "#E8946A", "#D4A843", "#3ECDC6", "#B8A5D4"];

const cards = [
  { lang: "English", example: "Why do stars twinkle at night?", guide: "Chat with Luno", rtl: false },
  { lang: "العربية", example: "احكِ لي قصة عن تنين يخاف من الظلام", guide: "قصص مع لومي", rtl: true },
  { lang: "Français", example: "Aujourd'hui, j'ai été courageux parce que...", guide: "Voyages avec Lolo", rtl: false },
  { lang: "中文", example: "奶奶，给我讲讲你小时候的故事", guide: "家庭空间 · Loti", rtl: false },
  { lang: "Español", example: "¿Por qué el cielo cambia de color?", guide: "Chat con Luno", rtl: false },
  { lang: "हिन्दी", example: "एक ऐसी लोमड़ी की कहानी बनाओ जो उड़ना सीख गई", guide: "कहानियाँ · Lumi", rtl: false },
];

export default function MultilingualSection() {
  return (
    <section className="py-20" style={{ backgroundColor: "#FAFAF7" }}>
      <div className="container" style={{ maxWidth: 1100 }}>
        <AnimatedSection>
          <h2
            className="font-heading text-center mb-12"
            style={{ fontSize: 36, color: "#2A2926" }}
          >
            Your child's world. Their language.
          </h2>
        </AnimatedSection>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {cards.map((card, i) => (
            <AnimatedSection key={card.lang} delay={i * 0.08}>
              <div
                className="bg-white rounded-2xl p-7 h-full flex flex-col transition-all duration-300 hover:-translate-y-[3px]"
                style={{
                  border: "1px solid #E8E6E1",
                  borderTop: `3px solid ${accentColors[i]}`,
                  borderRadius: 16,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 8px 24px rgba(42,41,38,0.08)")}
                onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
              >
                <p
                  className="font-body uppercase mb-3"
                  style={{ fontSize: 13, letterSpacing: "1.5px", color: "#9B978E" }}
                >
                  {card.lang}
                </p>
                <p
                  className="font-heading mb-4 flex-1"
                  style={{
                    fontSize: 20,
                    color: "#2A2926",
                    direction: card.rtl ? "rtl" : "ltr",
                    textAlign: card.rtl ? "right" : "left",
                  }}
                >
                  {card.example}
                </p>
                <p
                  className="font-body"
                  style={{
                    fontSize: 12,
                    color: accentColors[i],
                    direction: card.rtl ? "rtl" : "ltr",
                    textAlign: card.rtl ? "right" : "left",
                  }}
                >
                  {card.guide}
                </p>
              </div>
            </AnimatedSection>
          ))}
        </div>

        <AnimatedSection delay={0.5}>
          <p className="text-center mt-10 font-body" style={{ fontSize: 14, color: "#9B978E" }}>
            Plus Italian, Urdu, German, Portuguese, Japanese, Korean, and more.
          </p>
          <p className="text-center mt-2 font-body font-medium" style={{ fontSize: 15, color: "#2A2926" }}>
            Same safety. Same filters. Same parent visibility. Every language.
          </p>
        </AnimatedSection>
      </div>
    </section>
  );
}
