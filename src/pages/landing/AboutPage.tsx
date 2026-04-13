import { Link } from "react-router-dom";
import PageCTA from "@/components/landing/PageCTA";
import { Check } from "lucide-react";
import AnimatedSection from "@/components/landing/AnimatedSection";
import amritaImg from "@/assets/landing/amrita-sethi.png";

const commitments = [
  { icon: "🛡️", text: "We will never sell children's attention to advertisers or use it to drive engagement metrics" },
  { icon: "🔒", text: "Yoluno will never connect to the open internet or expose children to unfiltered content" },
  { icon: "🌱", text: "We will not compromise child safety to accelerate growth or feature development" },
  { icon: "🤖", text: "Our AI will be transparent — parents will always know how it works and what it can see" },
  { icon: "👨‍👩‍👧", text: "Family wellbeing will guide every product decision we make" },
];

const accountabilityLinks = [
  { icon: "🛡️", title: "Read our Safety Charter", subtitle: "The rules that govern every interaction", to: "/safety-charter" },
  { icon: "🤖", title: "How AI Works in Yoluno", subtitle: "What the technology does and how you stay in control", to: "/how-ai-works" },
  { icon: "📋", title: "Read our Data Practices", subtitle: "How your family's data is handled, stored, and protected", to: "/data-practices" },
];

const liveFeatures = [
  "Chat — conversational AI learning across a wide range of topics",
  "Stories — co-created, AI-narrated stories your child shapes",
  "Journeys — gentle habit-building prompts and reflections",
  "Family — voice recordings, photos, and shared family memories",
  "Parent Dashboard — full conversation logs, activity summaries, boundary controls, and content flagging",
  "Weekly summary emails for parents",
  "Mood check-ins with adaptive session responses",
  "Multilingual — available in 20+ languages including English, Arabic, French, and Chinese",
  "English National Curriculum integrated — Key Stage 1 through Key Stage 4",
];

export default function AboutPage() {
  return (
    <main className="pt-20" style={{ backgroundColor: "#FAFAF7" }}>
      {/* Hero */}
      <section className="py-16 md:py-24 px-6 md:px-12" style={{ backgroundColor: "#FAFAF7" }}>
        <div className="max-w-4xl mx-auto text-center">
          <AnimatedSection>
            <p className="font-body font-semibold uppercase mb-5" style={{ fontSize: 12.5, letterSpacing: 2.5, color: "#3ECDC6" }}>About Yoluno</p>
            <h1 className="font-heading text-4xl md:text-[48px] mb-8 leading-[1.15]" style={{ color: "#2A2926" }}>
              Why Yoluno Exists
            </h1>
            <p className="font-body max-w-[560px] mx-auto" style={{ fontSize: 17, color: "#6B675E", lineHeight: 1.7 }}>
              A calm digital world powered by AI — built for curiosity, imagination, and childhood. Designed with care by people who believe technology should serve families, not compete with them.
            </p>
          </AnimatedSection>
          <AnimatedSection delay={0.3} className="mt-14">
            <div className="relative rounded-2xl overflow-hidden shadow-warm border mx-auto max-w-3xl" style={{ aspectRatio: "16/9", borderColor: "#E8E6E1" }}>
              <video className="w-full h-full object-cover" autoPlay muted loop playsInline>
                <source src="/videos/hero-about.mp4" type="video/mp4" />
              </video>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* What We Saw */}
      <section className="py-16 md:py-24 px-6 md:px-12" style={{ backgroundColor: "#F5F3EE" }}>
        <div className="max-w-[1100px] mx-auto">
          <AnimatedSection className="text-center mb-12">
            <p className="font-body font-semibold uppercase mb-4" style={{ fontSize: 12.5, letterSpacing: 2.5, color: "#3ECDC6" }}>WHAT WE SAW</p>
            <h2 className="font-heading" style={{ fontSize: 40, color: "#2A2926" }}>Two Problems. One Mission.</h2>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 gap-5 md:gap-7">
            <AnimatedSection>
              <div
                className="bg-white rounded-2xl p-9 h-full transition-all duration-300 hover:-translate-y-[3px]"
                style={{ border: "1px solid #E8E6E1", borderTop: "3px solid #E8946A" }}
                onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 8px 24px rgba(42,41,38,0.08)")}
                onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
              >
                <h3 className="font-body font-semibold mb-4" style={{ fontSize: 20, color: "#2A2926" }}>The Attention Problem</h3>
                <p className="font-body" style={{ fontSize: 16, color: "#6B675E", lineHeight: 1.75 }}>
                  Most technology built for children is designed to capture their attention — not nurture it. Screens compete for time. Algorithms optimise for engagement. And childhood gets squeezed into the gaps between notifications.
                </p>
                <p className="font-body font-medium mt-5" style={{ fontSize: 16, color: "#2A2926" }}>
                  We believe children deserve technology that moves at their pace. Not the other way around.
                </p>
              </div>
            </AnimatedSection>

            <AnimatedSection delay={0.15}>
              <div
                className="bg-white rounded-2xl p-9 h-full transition-all duration-300 hover:-translate-y-[3px]"
                style={{ border: "1px solid #E8E6E1", borderTop: "3px solid #B8A5D4" }}
                onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 8px 24px rgba(42,41,38,0.08)")}
                onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
              >
                <h3 className="font-body font-semibold mb-4" style={{ fontSize: 20, color: "#2A2926" }}>The AI Problem</h3>
                <p className="font-body" style={{ fontSize: 16, color: "#6B675E", lineHeight: 1.75 }}>
                  AI is already the most powerful learning technology of this generation. But almost none of it has been built with children's safety as the starting point. It's designed for adults — then restricted for kids as an afterthought.
                </p>
                <p className="font-body font-medium mt-5" style={{ fontSize: 16, color: "#2A2926" }}>
                  We believe children deserve AI that was designed for them from day one.
                </p>
              </div>
            </AnimatedSection>
          </div>

          <AnimatedSection delay={0.3} className="text-center mt-10">
            <p className="font-heading italic" style={{ fontSize: 22, color: "#2A2926" }}>We started Yoluno to solve both.</p>
          </AnimatedSection>
        </div>
      </section>

      {/* The Belief */}
      <section className="pt-0 pb-20 md:pt-0 md:pb-[120px] px-6 md:px-12" style={{ backgroundColor: "#F5F3EE" }}>
        <div className="max-w-[600px] mx-auto text-center">
          <p className="font-body font-semibold uppercase mb-4" style={{ fontSize: 12.5, letterSpacing: 2.5, color: "#3ECDC6" }}>WHAT WE BELIEVE</p>
          <h2 className="font-heading mb-8 text-[28px] md:text-[34px]" style={{ color: "#2A2926", lineHeight: 1.25 }}>Let Kids Be Kids. The Tech Should Do the Work.</h2>
          <p className="font-body mb-6 text-[16px] md:text-[17px]" style={{ color: "#6B675E", lineHeight: 1.8 }}>
            We didn't build Yoluno because children need more technology. We built it because the technology they already have wasn't built for them.
          </p>
          <p className="font-body mb-6 text-[16px] md:text-[17px]" style={{ color: "#6B675E", lineHeight: 1.8 }}>
            Children learn best when they feel safe, unhurried, and free to follow their own curiosity. Not when they're chasing streaks. Not when an algorithm decides what comes next. Not when every tap is measured.
          </p>
          <p className="font-heading italic" style={{ fontSize: 20, color: "#2A2926", lineHeight: 1.6 }}>
            They need time to wonder. Space to imagine. And conversations that wait for them — not the other way around.
          </p>
        </div>
      </section>

      {/* The Decision */}
      <section className="py-16 md:py-24 px-6 md:px-12" style={{ backgroundColor: "#FAFAF7" }}>
        <div className="max-w-[1100px] mx-auto">
          <div className="grid md:grid-cols-[1fr_320px] gap-12 md:gap-16 items-start">
            {/* Left — text */}
            <div className="max-w-[560px]">
              <AnimatedSection>
                <p className="font-body font-semibold uppercase mb-4" style={{ fontSize: 12.5, letterSpacing: 2.5, color: "#3ECDC6" }}>WHY WE BUILT YOLUNO</p>
                <h2 className="font-heading mb-8" style={{ fontSize: 36, color: "#2A2926" }}>Why We Built Yoluno</h2>
              </AnimatedSection>
              <AnimatedSection delay={0.15}>
                <div className="space-y-5 font-body" style={{ fontSize: 17, color: "#6B675E", lineHeight: 1.75 }}>
                  <p>We chose to build something different — not another feed, not another game, not another screen fighting for your child's attention.</p>
                  <p>We chose to use AI — deliberately and carefully — to create a place where children can ask questions, build stories, explore ideas, and stay connected to the people who love them. A closed world with no internet access, no ads, and no data exploitation.</p>
                  <p>We knew that building AI for children meant taking on a deeper responsibility. So we built Yoluno with safety as the foundation — not a feature added later, but the architectural starting point.</p>
                  <p className="font-heading italic text-xl pt-2" style={{ color: "#2A2926" }}>In Yoluno, curiosity is welcome, imagination is protected, and families remain in control.</p>
                </div>
              </AnimatedSection>
            </div>

            {/* Right — moment cards */}
            <AnimatedSection delay={0.25}>
              <div className="grid grid-cols-2 md:grid-cols-1 gap-4">
                {[
                  { bg: "#E8F6F4", iconColor: "#3ECDC6", icon: "?", text: "Why does the sky change colour?", label: "Chat with Luno" },
                  { bg: "#F3EFF8", iconColor: "#B8A5D4", icon: "✎", text: "The fox who learned to fly — Chapter 3", label: "Stories with Lumi" },
                  { bg: "#FEF0EA", iconColor: "#E8946A", icon: "♡", text: "Being kind — Day 4 of 7", label: "Journeys with Lolo" },
                  { bg: "#FDF6E8", iconColor: "#D4A843", icon: "♪", text: "Grandma's story — 'When I was your age'", label: "Family with Loti" },
                ].map((card, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-xl p-5 flex items-start gap-3 transition-all duration-300 hover:-translate-y-0.5"
                    style={{ border: "1px solid #E8E6E1" }}
                    onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 6px 20px rgba(42,41,38,0.07)")}
                    onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
                  >
                    <div
                      className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-body font-bold"
                      style={{ backgroundColor: card.bg, color: card.iconColor, fontSize: 16 }}
                    >
                      {card.icon}
                    </div>
                    <div>
                      <p className="font-body italic" style={{ fontSize: 14, color: "#6B675E" }}>{card.text}</p>
                      <p className="font-body mt-1" style={{ fontSize: 11, color: "#9B978E" }}>{card.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Humility Line */}
      <section style={{ backgroundColor: "#FAFAF7" }}>
        <div className="max-w-[800px] mx-auto px-6 md:px-12">
          <hr style={{ borderColor: "#E8E6E1" }} />
          <div className="py-14 md:py-16 text-center">
            <p className="font-heading italic max-w-[600px] mx-auto" style={{ fontSize: 24, color: "#2A2926", lineHeight: 1.5 }}>
              We're parents building AI for other people's children. We never forget what that means. The commitments below are how we hold ourselves to it.
            </p>
          </div>
          <hr style={{ borderColor: "#E8E6E1" }} />
        </div>
      </section>

      {/* Commitments */}
      <section className="py-16 md:py-24 px-6 md:px-12" style={{ backgroundColor: "#FAFAF7" }}>
        <div className="max-w-[800px] mx-auto">
          <AnimatedSection className="text-center mb-12">
            <p className="font-body font-semibold uppercase mb-4" style={{ fontSize: 12.5, letterSpacing: 2.5, color: "#3ECDC6" }}>OUR COMMITMENTS</p>
            <h2 className="font-heading" style={{ fontSize: 36, color: "#2A2926" }}>What We Commit To</h2>
          </AnimatedSection>

          <div className="max-w-[640px] mx-auto space-y-5">
            {commitments.map((c, i) => (
              <AnimatedSection key={i} delay={i * 0.06}>
                <div className="flex items-start gap-4">
                  <span className="text-2xl flex-shrink-0 mt-0.5">{c.icon}</span>
                  <p className="font-body font-medium" style={{ fontSize: 16, color: "#2A2926" }}>{c.text}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>

          {/* Accountability Links */}
          <div className="mt-10 max-w-[800px] mx-auto">
            <p className="font-body mb-6 text-center" style={{ fontSize: 15, color: "#9B978E" }}>
              These aren't just words on a page. Here's how we hold ourselves accountable:
            </p>
            <div className="grid md:grid-cols-3 gap-4">
              {accountabilityLinks.map((link, i) => (
                <Link
                  key={i}
                  to={link.to}
                  className="bg-white rounded-xl p-6 text-center transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
                  style={{ border: "1px solid #E8E6E1" }}
                >
                  <span className="text-2xl mb-3 block">{link.icon}</span>
                  <h4 className="font-body font-bold mb-1 hover:underline" style={{ fontSize: 15, color: "#3ECDC6" }}>{link.title}</h4>
                  <p className="font-body" style={{ fontSize: 13, color: "#9B978E" }}>{link.subtitle}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Who We Are */}
      <section className="py-16 md:py-24 px-6 md:px-12" style={{ backgroundColor: "#F5F3EE" }}>
        <div className="max-w-[1000px] mx-auto">
          <AnimatedSection className="text-center mb-12">
            <p className="font-body font-semibold uppercase mb-4" style={{ fontSize: 12.5, letterSpacing: 2.5, color: "#3ECDC6" }}>WHO WE ARE</p>
            <h2 className="font-heading" style={{ fontSize: 36, color: "#2A2926" }}>Built by Parents. Deliberately, Not Fast.</h2>
          </AnimatedSection>

          <AnimatedSection>
            <div className="max-w-[680px] mx-auto space-y-5 font-body mb-14" style={{ fontSize: 17, color: "#6B675E", lineHeight: 1.75 }}>
              <p>Yoluno is a small team — parents, engineers, and designers — building with care, not speed.</p>
              <p>We believe a children's AI product should be made with the same thoughtfulness you'd bring to anything else in your child's life. That means testing carefully, being honest about what we've built and what we're still learning, and treating every family's trust as something we earn — never assume.</p>
              <p>We don't have all the answers. But we have clear principles, and we'd rather build slowly and get it right than rush and get it wrong.</p>
            </div>
          </AnimatedSection>

          {/* Founder Bios */}
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <AnimatedSection>
              <div className="bg-white rounded-2xl p-8 h-full" style={{ border: "1px solid #E8E6E1" }}>
                <div className="flex items-center gap-4 mb-5">
                  <img src={amritaImg} alt="Amrita Sethi" className="w-20 h-20 rounded-full object-cover" />
                  <div>
                    <h3 className="font-body font-semibold" style={{ fontSize: 18, color: "#2A2926" }}>Amrita Sethi</h3>
                    <p className="font-body font-semibold uppercase" style={{ fontSize: 13, letterSpacing: 1.5, color: "#3ECDC6" }}>Founder</p>
                  </div>
                </div>
                <p className="font-body" style={{ fontSize: 15, color: "#6B675E", lineHeight: 1.7 }}>
                  Pioneering artist, technologist, and new mother. Amrita left a 15-year career in global banking to create Voice Note Art — a new art form that transforms sound into visual art — becoming the UAE's first NFT artist and earning commissions from Art Dubai, Expo 2020, and a portrait for HH Sheikh Mohammed Bin Rashid Al Maktoum. Her work spans murals, AR installations, and digital collectibles, including the Middle East's largest augmented reality mural at DIFC. Featured on CNN and recognised as an MBZUAI AI×Arts Fellow, Amrita has spent her career at the intersection of creativity and emerging technology. She started Yoluno after becoming a mother — driven by the question of what kind of digital world her daughter would grow up in, and determined to build something worthy of the answer. Based in Dubai.
                </p>
                <a
                  href="https://www.linkedin.com/in/amrita-sethi-58757514/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 mt-4 font-body font-semibold text-sm hover:underline"
                  style={{ color: "#3ECDC6" }}
                >
                  LinkedIn →
                </a>
              </div>
            </AnimatedSection>

            <AnimatedSection delay={0.15}>
              <div className="bg-white rounded-2xl p-8 h-full" style={{ border: "1px solid #E8E6E1" }}>
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-20 h-20 rounded-full flex items-center justify-center font-heading text-2xl" style={{ backgroundColor: "#F5F3EE", color: "#2A2926" }}>J</div>
                  <div>
                    <h3 className="font-body font-semibold" style={{ fontSize: 18, color: "#2A2926" }}>Jawad Ashraf</h3>
                    <p className="font-body font-semibold uppercase" style={{ fontSize: 13, letterSpacing: 1.5, color: "#3ECDC6" }}>Co-Founder & Technology Lead</p>
                  </div>
                </div>
                <p className="font-body" style={{ fontSize: 15, color: "#6B675E", lineHeight: 1.7 }}>
                  Technologist and entrepreneur with over 30 years in the industry. Jawad has built products used by millions — from a children's gaming platform with over 24 million downloads, to the technology behind The Entertainer, one of the Middle East's most recognised consumer brands, through to co-founding and leading Vanar Chain as CEO. He has built and managed teams across the UAE, UK, US, Australia, Norway, and Turkey. At Yoluno, Jawad leads the technical architecture — including the AI safety systems, data privacy infrastructure, and the closed-environment design that keeps children protected. Based in Dubai.
                </p>
              </div>
            </AnimatedSection>
          </div>

          {/* Advisory */}
          <AnimatedSection>
            <div className="max-w-[640px] mx-auto rounded-xl p-6 text-center" style={{ backgroundColor: "#FAFAF7", border: "1px solid #E8E6E1" }}>
              <p className="font-body" style={{ fontSize: 15, color: "#6B675E", lineHeight: 1.7 }}>
                We're actively building our advisory network in child psychology, education, and AI safety. If you're a child psychologist, educator, safeguarding professional, or AI safety researcher interested in shaping how AI serves children, we'd welcome a conversation.
              </p>
              <a href="mailto:advisory@yoluno.com" className="inline-block mt-3 font-body font-semibold" style={{ fontSize: 15, color: "#3ECDC6" }}>
                advisory@yoluno.com
              </a>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Where We Are */}
      <section className="py-16 md:py-24 px-6 md:px-12" style={{ backgroundColor: "#FAFAF7" }}>
        <div className="max-w-[680px] mx-auto">
          <AnimatedSection>
            <p className="font-body font-semibold uppercase mb-4" style={{ fontSize: 12.5, letterSpacing: 2.5, color: "#3ECDC6" }}>WHERE WE ARE</p>
            <h2 className="font-heading mb-6" style={{ fontSize: 36, color: "#2A2926" }}>Everything on This Site Is Live</h2>
            <p className="font-body mb-8" style={{ fontSize: 17, color: "#6B675E", lineHeight: 1.75 }}>
              Yoluno launched in April 2026. Every space, every feature, and every safety system described on this site is live and working today.
            </p>
          </AnimatedSection>
          <AnimatedSection delay={0.1}>
            <div className="space-y-3 mb-8">
              {liveFeatures.map((feat, i) => (
                <div key={i} className="flex items-start gap-3">
                  <Check className="flex-shrink-0 mt-1" style={{ color: "#3ECDC6" }} size={18} />
                  <span className="font-body" style={{ fontSize: 15, color: "#2A2926" }}>{feat}</span>
                </div>
              ))}
            </div>
            <p className="font-body mb-3" style={{ fontSize: 15, color: "#9B978E" }}>
              We're still learning and improving with every family who joins. If you have feedback, we hear it — and it shapes what comes next.
            </p>
            <Link to="/blog" className="font-body font-semibold" style={{ fontSize: 15, color: "#3ECDC6" }}>
              Follow our progress on the blog →
            </Link>
          </AnimatedSection>
        </div>
      </section>

      <PageCTA
        heading="We built it for our children. Now it's ready for yours."
        subtitle="Try Yoluno free — and see why we'd rather build slowly and get it right."
      />
    </main>
  );
}
