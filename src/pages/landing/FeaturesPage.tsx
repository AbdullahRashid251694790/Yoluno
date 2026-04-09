import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import AnimatedSection from "@/components/landing/AnimatedSection";
import lunoImg from "@/assets/landing/luno.png";
import loloImg from "@/assets/landing/lolo.png";
import lumiImg from "@/assets/landing/lumi.png";
import lottieImg from "@/assets/landing/lottie.png";
import curiosityTreeImg from "@/assets/landing/curiosity-tree.png";
import storiesBgImg from "@/assets/landing/stories-bg.png";
import journeysBgImg from "@/assets/landing/journeys-bg.png";
import familyBgImg from "@/assets/landing/family-bg.png";

const spacesDetail = [
  {
    emoji: "💬", title: "Chat", subtitle: "Curiosity & Conversation", tagline: "Where questions begin — and real learning follows.", character: "Luno", img: lunoImg, color: "border-luno",
    desc: "Your child sits down and asks, \"Why is the sky blue?\" And instead of a search engine, a screen full of ads, or a rabbit hole into the wrong corner of the internet — they get a warm, patient answer. Then a follow-up question. Then a little quiz to see what stuck.\n\nSome days it's science. Some days it's dinosaurs. Some days it's fractions, or spelling, or \"Why do people cry when they're happy?\" Wherever the question leads — one gentle step at a time.\n\nAnd the answers aren't guesses. Yoluno's knowledge comes from verified sources and can align to your child's school curriculum — so whether they're exploring freely or practising what they learned in class, the foundation is solid.\n\nA 5-year-old and a 13-year-old both get answers that meet them exactly where they are.",
    features: [
      "Questions met with patience, not overwhelm",
      "Answers drawn from verified, curriculum-aligned sources",
      "Adapts to every age — from early years to secondary school",
      "Little quizzes that feel like games, not tests",
      "Topics explored at their pace, not an algorithm's",
      "Every conversation remembered for next time",
    ],
  },
  {
    emoji: "📖", title: "Stories", subtitle: "Imagination & Creativity", tagline: "Where imagination leads.", character: "Lumi", img: lumiImg, color: "border-lumi",
    desc: "\"What if the fox could fly?\" And just like that, the story changes.\n\nYour child doesn't consume stories here — they help make them. They choose what happens next. They name the characters. They decide if the adventure ends tonight or picks up again tomorrow.\n\nStories aren't rushed. They're built slowly, revisited when your child is ready, and sometimes just… left to rest. Like a book with a bookmark in it, waiting on the nightstand.",
    features: [
      "Stories shaped by your child's imagination",
      "Characters and choices they create themselves",
      "Narrated aloud, so they can just listen",
       "Keepsakes you can print and keep forever",
       "A quiet, unhurried space to process feelings through stories",
    ],
  },
  {
    emoji: "🧭", title: "Journeys", subtitle: "Habits & Gentle Growth", tagline: "Where small things grow quietly.", character: "Lolo", img: loloImg, color: "border-lolo",
    desc: "There's no scoreboard here. No streak counter. No coins to collect.\n\nInstead, your child might start a journey about being brave — and over a few days, through little prompts and reflections, they begin to notice their own courage. Or they explore kindness. Or gratitude. Or just… what it feels like to try something new.\n\nProgress isn't measured in points. It's felt in moments. A child who says \"I was nervous but I did it anyway\" has grown more than any leaderboard could show.",
    features: [
      "Gentle routines that don't feel like homework",
      "Quiet reflections that build real awareness",
      "No scores, no streaks, no pressure",
       "Growth you'll notice at the dinner table",
       "Builds emotional vocabulary alongside daily habits",
    ],
  },
  {
    emoji: "👨‍👩‍👧", title: "Family", subtitle: "Memory & Belonging", tagline: "Where your family's stories stay alive.", character: "Lottie", img: lottieImg, color: "border-lala",
    desc: "One evening, your child asks: \"What was Grandma like when she was little?\"\n\nAnd instead of silence, or a vague answer you're too tired to give — they hear a story. In your mum's voice. Or your dad's. Or yours. A story you recorded one afternoon, not knowing when it would matter.\n\nThis is where your family lives inside Yoluno. Photos. Voice recordings. Traditions. The things that make your family yours. Your child can explore them like a conversation — asking questions, hearing stories, feeling connected to something bigger than themselves.",
    features: [
      "Family stories told in the voices your child knows",
      "Photos and memories they can explore and ask about",
      "A sense of belonging that grows over time",
      "Everything stays private, within your family's world",
    ],
  },
];

export default function FeaturesPage() {
  return (
    <main className="pt-20">
      {/* Hero */}
      <section className="section-padding" style={{ background: 'linear-gradient(180deg, #FFFDF7 0%, #E8F8F4 100%)' }}>
        <div className="container max-w-4xl text-center">
          <AnimatedSection>
            <p className="text-label mb-4">Features</p>
            <h1 className="font-heading-landing text-4xl md:text-5xl font-bold text-foreground mb-3">
              Step into Yoluno's World
            </h1>
            <p className="font-body text-xl font-bold text-foreground mb-4">
              A World That Grows With Them
            </p>
            <p className="font-body text-lg text-muted-foreground leading-relaxed mb-8">
              Imagine a place where your child can ask any question, build a story, explore a feeling, or hear their grandmother's voice — all in one calm, safe world. Four gentle spaces, each one waiting for them.
            </p>
          </AnimatedSection>

          <AnimatedSection delay={0.2}>
            <div className="rounded-3xl overflow-hidden shadow-warm-lg mb-8">
              <video
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-auto"
              >
                <source src="/videos/yoluno-world.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
          </AnimatedSection>

          <AnimatedSection delay={0.3}>
            <Button size="lg" asChild>
              <a href="#spaces">Explore the Spaces</a>
            </Button>
          </AnimatedSection>
        </div>
      </section>

      {/* Section Intro */}
      <section id="spaces" className="section-padding bg-background">
        <div className="container max-w-3xl text-center">
          <AnimatedSection>
            <h2 className="font-heading-landing text-3xl font-bold text-foreground mb-4">Four Spaces. One World.</h2>
            <p className="font-body text-lg text-muted-foreground leading-relaxed">
              Each space exists for a different kind of curiosity. Your child moves between them freely — exploring what interests them, at the pace that feels right.
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* Four Spaces */}
      {spacesDetail.map((space, i) => (
        <section
          key={space.title}
          className={`section-padding relative overflow-hidden ${i % 2 === 0 ? "bg-linen" : "bg-background"}`}
        >
          {/* Background tree image for Chat section */}
          {i === 0 && (
            <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
              <img
                src={curiosityTreeImg}
                alt=""
                className="w-full h-full object-cover opacity-[0.22]"
              />
            </div>
          )}
          {/* Background image for Stories section */}
          {i === 1 && (
            <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
              <img
                src={storiesBgImg}
                alt=""
                className="w-full h-full object-cover opacity-[0.22]"
              />
            </div>
          )}
          {/* Background image for Journeys section */}
          {i === 2 && (
            <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
              <img
                src={journeysBgImg}
                alt=""
                className="w-full h-full object-cover opacity-[0.22]"
              />
            </div>
          )}
          {/* Background image for Family section */}
          {i === 3 && (
            <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
              <img
                src={familyBgImg}
                alt=""
                className="w-full h-full object-cover opacity-[0.22]"
              />
            </div>
          )}
          <div className="container max-w-5xl relative z-10">
            <AnimatedSection>
              <div className={`grid md:grid-cols-2 gap-12 items-center`}>
                <div className={`${i % 2 !== 0 ? "md:order-2" : ""} backdrop-blur-md bg-background/60 rounded-3xl p-8 shadow-warm`}>
                  <span
                    className="inline-block font-body font-bold uppercase tracking-widest mb-3 px-5 py-2 rounded-pill text-base"
                    style={i === 0 ? {
                      background: 'linear-gradient(135deg, hsl(174 60% 48%), hsl(174 55% 58%))',
                      color: 'white',
                      boxShadow: '0 4px 16px rgba(61, 214, 200, 0.3)',
                      letterSpacing: '3px',
                    } : i === 1 ? {
                      background: 'linear-gradient(135deg, hsl(270 55% 65%), hsl(270 50% 75%))',
                      color: 'white',
                      boxShadow: '0 4px 16px rgba(160, 120, 210, 0.3)',
                      letterSpacing: '3px',
                    } : i === 2 ? {
                      background: 'linear-gradient(135deg, hsl(15 75% 55%), hsl(10 70% 65%))',
                      color: 'white',
                      boxShadow: '0 4px 16px rgba(220, 100, 70, 0.3)',
                      letterSpacing: '3px',
                    } : i === 3 ? {
                      background: 'linear-gradient(135deg, hsl(40 70% 45%), hsl(35 65% 55%))',
                      color: 'white',
                      boxShadow: '0 4px 16px rgba(212, 168, 67, 0.3)',
                      letterSpacing: '3px',
                    } : undefined}
                  >
                    {space.emoji} {space.title}
                  </span>
                  <p className="font-body text-sm font-bold text-foreground/70 uppercase tracking-wide mb-1">{space.subtitle}</p>
                  <h2 className="font-heading-landing text-3xl font-bold text-foreground mb-2">{space.tagline}</h2>
                  {space.desc.split("\n\n").map((paragraph, pi) => (
                    <p key={pi} className="font-body text-foreground/80 text-lg leading-relaxed mb-4">{paragraph}</p>
                  ))}
                  <ul className="space-y-3 mb-6">
                    {space.features.map((f) => (
                      <li key={f} className="flex items-center gap-3 font-body text-foreground">
                        <span className="text-primary">✓</span> {f}
                      </li>
                    ))}
                  </ul>
                  <Link to="/features" className="font-body text-primary font-bold hover:underline">
                    Learn more →
                  </Link>
                </div>
                <div className={`flex flex-col items-center justify-center ${i % 2 !== 0 ? "md:order-1" : ""}`}>
                  <img src={space.img} alt={space.character} className="w-52 h-52 object-contain drop-shadow-lg" />
                  <p className="font-heading-landing text-center font-bold text-foreground mt-4">Guided by {space.character}</p>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </section>
      ))}

      {/* Warm Handoff to Parents */}
      <section className="section-padding bg-background">
        <div className="container max-w-3xl text-center">
          <AnimatedSection>
            <h2 className="font-heading-landing text-3xl font-bold text-foreground mb-6">
              Every Space Is Guided by Care — and Governed by You.
            </h2>
            <p className="font-body text-lg text-muted-foreground leading-relaxed mb-8">
              You set the boundaries. You choose what's allowed. Yoluno operates within those limits — gently, automatically, and without exception. Your child explores freely. You stay informed.
            </p>
            <Button size="lg" variant="gold" asChild>
              <Link to="/for-parents">See How Parents Stay in Control →</Link>
            </Button>
          </AnimatedSection>
        </div>
      </section>

      {/* Quote */}
      <section className="section-padding bg-linen">
        <div className="container max-w-3xl text-center">
          <AnimatedSection>
            <blockquote className="bg-card rounded-2xl p-8 shadow-warm">
              <p className="font-heading-landing text-xl text-foreground italic">
                "Children don't need more content. They need presence, patience, and possibility."
              </p>
            </blockquote>
          </AnimatedSection>
        </div>
      </section>

      {/* Final CTA */}
      <section className="section-padding bg-background text-center">
        <div className="container max-w-2xl">
          <AnimatedSection>
            <h2 className="font-heading-landing text-3xl font-bold text-foreground mb-4">A Calm Place for Growing Minds</h2>
            <p className="font-body text-muted-foreground text-lg mb-8">
              When you're ready, Yoluno is here. No pressure. Just a calm place for your child to wonder.
            </p>
            <Button size="lg" asChild>
              <Link to="/signup">Start Exploring Together</Link>
            </Button>
            <p className="font-body text-stone text-sm mt-4">No credit card required</p>
          </AnimatedSection>
        </div>
      </section>
    </main>
  );
}
