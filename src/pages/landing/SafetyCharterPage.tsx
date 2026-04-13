import { useState, useEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";
import AnimatedSection from "@/components/landing/AnimatedSection";

const sections = [
  { id: "who-this-is-for", title: "Who This Is For" },
  { id: "what-yoluno-is", title: "What Yoluno Is" },
  { id: "how-the-ai-works", title: "How the AI Works" },
  { id: "content-boundaries", title: "Content Boundaries" },
  { id: "emotional-interactions", title: "Emotional Interactions" },
  { id: "the-family-space", title: "The Family Space" },
  { id: "data-practices", title: "Data Practices" },
  { id: "parent-controls", title: "Parent Controls" },
  { id: "when-things-go-wrong", title: "When Things Go Wrong" },
  { id: "our-commitments", title: "Our Commitments" },
  { id: "how-to-reach-us", title: "How to Reach Us" },
  { id: "how-this-charter-is-updated", title: "How This Charter Is Updated" },
];

export default function SafetyCharterPage() {
  const [activeSection, setActiveSection] = useState(sections[0].id);
  const [tocOpen, setTocOpen] = useState(false);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) {
          setActiveSection(visible[0].target.id);
        }
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: 0 }
    );
    sections.forEach((s) => {
      const el = sectionRefs.current[s.id];
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    sectionRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
    setTocOpen(false);
  };

  const setRef = (id: string) => (el: HTMLElement | null) => {
    sectionRefs.current[id] = el;
  };

  return (
    <main className="pt-20 bg-background">
      <div className="relative max-w-[1200px] mx-auto px-6 md:px-12">
        {/* Desktop TOC */}
        <nav className="hidden lg:block fixed left-[max(1rem,calc((100vw-1200px)/2-200px))] top-[140px] w-[180px] z-30">
          <ul className="space-y-2">
            {sections.map((s) => (
              <li key={s.id}>
                <button
                  onClick={() => scrollTo(s.id)}
                  className={`text-left font-body text-[13px] leading-snug transition-colors ${
                    activeSection === s.id ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {s.title}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Content */}
        <div className="max-w-[800px] mx-auto pt-[80px] pb-[100px]">
          {/* Hero */}
          <AnimatedSection>
            <p className="font-body text-[12.5px] font-semibold uppercase tracking-[2.5px] text-primary mb-4">
              Safety Charter
            </p>
            <h1 className="font-heading text-[36px] md:text-[44px] text-foreground mb-6 leading-[1.15]">
              How We Keep Children Safe
            </h1>
            <p className="font-body text-[17px] text-muted-foreground leading-[1.7] mb-4">
              This charter governs every interaction your child has in Yoluno. It is not a set of aspirations. It is a set of rules — built into the product, enforced by the technology, and visible to you.
            </p>
            <p className="font-body text-[13px] text-muted-foreground/70">Last updated: April 2026</p>
          </AnimatedSection>

          {/* Mobile TOC */}
          <div className="lg:hidden mt-8">
            <button
              onClick={() => setTocOpen(!tocOpen)}
              className="w-full flex items-center justify-between bg-card border border-border rounded-xl px-5 py-3 font-body text-[14px] text-foreground font-medium"
            >
              Table of Contents
              <ChevronDown className={`w-4 h-4 transition-transform ${tocOpen ? "rotate-180" : ""}`} />
            </button>
            {tocOpen && (
              <div className="bg-card border border-border border-t-0 rounded-b-xl px-5 py-3 space-y-2">
                {sections.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => scrollTo(s.id)}
                    className={`block text-left font-body text-[13px] w-full ${
                      activeSection === s.id ? "text-primary font-medium" : "text-muted-foreground"
                    }`}
                  >
                    {s.title}
                  </button>
                ))}
              </div>
            )}
          </div>

          <hr className="border-border my-12" />

          {/* Section 1 */}
          <section id="who-this-is-for" ref={setRef("who-this-is-for")} className="mb-16 scroll-mt-24">
            <h2 className="font-heading text-[28px] text-foreground mb-5">1. Who This Is For</h2>
            <p className="font-body text-[16px] text-muted-foreground leading-[1.75]">
              This charter is written for parents, educators, regulators, and anyone who needs to understand how Yoluno protects children. We've written it in plain language because we believe safety should be understandable, not buried in legal text. If anything here is unclear, email us directly: <a href="mailto:safety@yoluno.com" className="text-primary hover:underline">safety@yoluno.com</a>
            </p>
          </section>

          {/* Section 2 */}
          <section id="what-yoluno-is" ref={setRef("what-yoluno-is")} className="mb-16 scroll-mt-24">
            <h2 className="font-heading text-[28px] text-foreground mb-5">2. What Yoluno Is</h2>
            <p className="font-body text-[16px] text-muted-foreground leading-[1.75] mb-6">
              Yoluno is an AI-guided world for children aged 3 to 14. It uses AI language models to respond to children's questions, co-create stories, guide reflective journeys, and support family connection.
            </p>
            <h3 className="font-body text-[16px] font-semibold text-foreground mt-7 mb-3">Yoluno is:</h3>
            <ul className="list-disc pl-5 space-y-2 font-body text-[15px] text-muted-foreground leading-[1.7] marker:text-muted-foreground/50">
              <li>A closed environment with no access to the open internet</li>
              <li>Governed entirely by parents through the Parent Dashboard</li>
              <li>Designed for children from the ground up — not an adult product with restrictions added</li>
            </ul>
            <h3 className="font-body text-[16px] font-semibold text-foreground mt-7 mb-3">Yoluno is not:</h3>
            <ul className="list-disc pl-5 space-y-2 font-body text-[15px] text-muted-foreground leading-[1.7] marker:text-muted-foreground/50">
              <li>A search engine or web browser</li>
              <li>A social media platform — children cannot interact with other users</li>
              <li>A therapeutic or clinical tool — it does not diagnose, treat, or counsel</li>
              <li>A replacement for parental judgment, teacher guidance, or professional support</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section id="how-the-ai-works" ref={setRef("how-the-ai-works")} className="mb-16 scroll-mt-24">
            <h2 className="font-heading text-[28px] text-foreground mb-5">3. How the AI Works</h2>
            <p className="font-body text-[16px] text-muted-foreground leading-[1.75] mb-6">
              Yoluno uses AI language models to generate responses in real time. This means your child's conversations are not scripted or pre-written — they are generated dynamically based on what your child says, within the boundaries you've set.
            </p>
            <h3 className="font-body text-[16px] font-semibold text-foreground mt-7 mb-3">What the AI can do:</h3>
            <ul className="list-disc pl-5 space-y-2 font-body text-[15px] text-muted-foreground leading-[1.7] marker:text-muted-foreground/50">
              <li>Answer questions across a wide range of age-appropriate topics</li>
              <li>Co-create stories based on your child's choices and imagination</li>
              <li>Guide gentle reflective prompts about emotions, habits, and growth</li>
              <li>Adapt vocabulary, tone, and complexity to your child's age</li>
            </ul>
            <h3 className="font-body text-[16px] font-semibold text-foreground mt-7 mb-3">What the AI cannot do:</h3>
            <ul className="list-disc pl-5 space-y-2 font-body text-[15px] text-muted-foreground leading-[1.7] marker:text-muted-foreground/50">
              <li>Access the open internet or any external data source</li>
              <li>Remember conversations across sessions unless you enable this in Settings</li>
              <li>Generate, display, or link to images, videos, or audio from outside Yoluno</li>
              <li>Communicate with any other user, system, or platform</li>
              <li>Override boundaries set by a parent</li>
            </ul>
            <h3 className="font-body text-[16px] font-semibold text-foreground mt-7 mb-3">What the AI will never do:</h3>
            <ul className="list-disc pl-5 space-y-2 font-body text-[15px] text-muted-foreground leading-[1.7] marker:text-muted-foreground/50">
              <li>Encourage a child to keep secrets from parents or trusted adults</li>
              <li>Provide medical, legal, or psychiatric advice</li>
              <li>Generate sexual, violent, or age-inappropriate content</li>
              <li>Attempt to form an emotional bond or dependency — Yoluno's characters are guides, not friends or companions</li>
              <li>Collect, infer, or store biometric data</li>
            </ul>
            <p className="font-body text-[16px] text-muted-foreground leading-[1.75] mt-6">
              If the AI generates a response that falls outside these boundaries, that is a failure — not a feature. You can flag any response directly from the Parent Dashboard, and our team reviews flagged content within 24 hours.
            </p>
          </section>

          {/* Section 4 */}
          <section id="content-boundaries" ref={setRef("content-boundaries")} className="mb-16 scroll-mt-24">
            <h2 className="font-heading text-[28px] text-foreground mb-5">4. Content Boundaries</h2>
            <p className="font-body text-[16px] text-muted-foreground leading-[1.75] mb-6">
              All AI-generated content in Yoluno passes through safety filters before reaching your child. These filters are designed specifically for children and operate at multiple levels.
            </p>
            <h3 className="font-body text-[16px] font-semibold text-foreground mt-7 mb-3">Age-based filtering:</h3>
            <p className="font-body text-[16px] text-muted-foreground leading-[1.75] mb-6">
              Every child profile has an age setting. The AI adjusts vocabulary, topic depth, and emotional complexity based on this age. A 5-year-old and a 12-year-old receive fundamentally different responses to the same question.
            </p>
            <h3 className="font-body text-[16px] font-semibold text-foreground mt-7 mb-3">Topic-level controls:</h3>
            <p className="font-body text-[16px] text-muted-foreground leading-[1.75] mb-6">
              Parents can enable or disable entire topic categories per child from the Parent Dashboard. Disabled topics are blocked at the system level — the AI cannot discuss them regardless of what the child asks.
            </p>
            <h3 className="font-body text-[16px] font-semibold text-foreground mt-7 mb-3">Boundary enforcement:</h3>
            <p className="font-body text-[16px] text-muted-foreground leading-[1.75] mb-6">
              When a child's question approaches or crosses a boundary, the AI does not answer. It pauses, acknowledges the child's curiosity without shame, and gently redirects to something safe and engaging. The parent is notified in the Dashboard.
            </p>
            {/* Special coral-bordered block */}
            <div className="bg-secondary border-l-[3px] border-[#E8946A] p-6 mt-6">
              <h3 className="font-body text-[16px] font-semibold text-foreground mb-3">Default restrictions — these cannot be overridden by parents:</h3>
              <ul className="list-disc pl-5 space-y-2 font-body text-[15px] text-muted-foreground leading-[1.7] marker:text-muted-foreground/50">
                <li>Explicit sexual content</li>
                <li>Graphic violence or gore</li>
                <li>Self-harm, suicide, or eating disorder content</li>
                <li>Weapons creation or dangerous activities</li>
                <li>Content that could facilitate grooming, abuse, or exploitation</li>
                <li>Hate speech, discrimination, or extremist content</li>
                <li>Instructions for illegal activities</li>
                <li>Personal data solicitation — asking children for addresses, phone numbers, school names</li>
              </ul>
            </div>
          </section>

          {/* Section 5 */}
          <section id="emotional-interactions" ref={setRef("emotional-interactions")} className="mb-16 scroll-mt-24">
            <h2 className="font-heading text-[28px] text-foreground mb-5">5. Emotional Interactions</h2>
            <p className="font-body text-[16px] text-muted-foreground leading-[1.75] mb-6">
              Yoluno includes features that interact with children's emotions — mood check-ins, reflective Journeys, and adaptive responses based on how a child says they're feeling. We take this responsibility seriously.
            </p>
            <h3 className="font-body text-[16px] font-semibold text-foreground mt-7 mb-3">What we do:</h3>
            <ul className="list-disc pl-5 space-y-2 font-body text-[15px] text-muted-foreground leading-[1.7] marker:text-muted-foreground/50">
              <li>Luno asks children how they're feeling at the start of each session</li>
              <li>If a child reports feeling sad, worried, or angry, Yoluno offers gentle options: a comforting story, family photos, or a space to talk</li>
              <li>Journeys include reflective prompts about feelings like bravery, kindness, and gratitude</li>
              <li>All emotional check-ins are visible to parents in the Dashboard</li>
            </ul>
            <h3 className="font-body text-[16px] font-semibold text-foreground mt-7 mb-3">What we do not do:</h3>
            <ul className="list-disc pl-5 space-y-2 font-body text-[15px] text-muted-foreground leading-[1.7] marker:text-muted-foreground/50">
              <li>Diagnose or assess mental health conditions</li>
              <li>Provide therapeutic interventions or counselling</li>
              <li>Use emotional data to manipulate engagement or session length</li>
              <li>Make promises the AI cannot keep</li>
              <li>Attempt to replace human emotional support from parents, teachers, or professionals</li>
            </ul>
            <h3 className="font-body text-[16px] font-semibold text-foreground mt-7 mb-3">If a child expresses distress:</h3>
            <p className="font-body text-[16px] text-muted-foreground leading-[1.75] mb-6">
              If a child shares something that suggests they may be in distress, Yoluno responds with care and encourages them to talk to a parent or trusted adult. Yoluno does not attempt to handle crisis situations. The parent is notified through the Dashboard.
            </p>
            <p className="font-body text-[16px] text-muted-foreground leading-[1.75]">
              We do not claim that Yoluno's emotional features constitute therapy, counselling, or clinical intervention of any kind. They are designed to support emotional vocabulary and self-awareness within the context of play and exploration.
            </p>
          </section>

          {/* Section 6 */}
          <section id="the-family-space" ref={setRef("the-family-space")} className="mb-16 scroll-mt-24">
            <h2 className="font-heading text-[28px] text-foreground mb-5">6. The Family Space</h2>
            <p className="font-body text-[16px] text-muted-foreground leading-[1.75] mb-6">
              The Family space allows parents to upload voice recordings, photos, and family stories that their child can access within Yoluno.
            </p>
            <h3 className="font-body text-[16px] font-semibold text-foreground mt-7 mb-3">How it works:</h3>
            <ul className="list-disc pl-5 space-y-2 font-body text-[15px] text-muted-foreground leading-[1.7] marker:text-muted-foreground/50">
              <li>Only parents can upload content to the Family space, through the Parent Dashboard</li>
              <li>Children can browse, listen to, and revisit family content</li>
              <li>The AI does not generate, fabricate, or alter family content in any way</li>
              <li>The AI does not clone, synthesise, or reproduce anyone's voice</li>
              <li>Family content is stored securely, encrypted, and accessible only to your family</li>
              <li>Parents can delete any family content at any time — deletion is permanent and immediate</li>
            </ul>
            <h3 className="font-body text-[16px] font-semibold text-foreground mt-7 mb-3">What the AI can do in the Family space:</h3>
            <ul className="list-disc pl-5 space-y-2 font-body text-[15px] text-muted-foreground leading-[1.7] marker:text-muted-foreground/50">
              <li>Present content that parents have uploaded</li>
              <li>Help children navigate family memories through simple prompts</li>
            </ul>
            <h3 className="font-body text-[16px] font-semibold text-foreground mt-7 mb-3">What the AI cannot do in the Family space:</h3>
            <ul className="list-disc pl-5 space-y-2 font-body text-[15px] text-muted-foreground leading-[1.7] marker:text-muted-foreground/50">
              <li>Generate new information about family members</li>
              <li>Invent or fabricate family stories, details, or history</li>
              <li>Answer questions about family members beyond what parents have explicitly provided</li>
              <li>Use family content to train AI models or improve the product</li>
            </ul>
          </section>

          {/* Section 7 */}
          <section id="data-practices" ref={setRef("data-practices")} className="mb-16 scroll-mt-24">
            <h2 className="font-heading text-[28px] text-foreground mb-5">7. Data Practices</h2>
            <h3 className="font-body text-[16px] font-semibold text-foreground mt-7 mb-3">What we collect:</h3>
            <ul className="list-disc pl-5 space-y-2 font-body text-[15px] text-muted-foreground leading-[1.7] marker:text-muted-foreground/50">
              <li>Account information — parent email, child's first name, age</li>
              <li>Conversation logs between children and Yoluno's AI guides</li>
              <li>Mood check-in responses</li>
              <li>Story content co-created by children</li>
              <li>Journey progress and reflections</li>
              <li>Family content uploaded by parents — photos, voice recordings, stories</li>
              <li>Basic usage data — session length, features used</li>
            </ul>
            <h3 className="font-body text-[16px] font-semibold text-foreground mt-7 mb-3">What we do with it:</h3>
            <ul className="list-disc pl-5 space-y-2 font-body text-[15px] text-muted-foreground leading-[1.7] marker:text-muted-foreground/50">
              <li>Provide the Yoluno experience to your child</li>
              <li>Show activity summaries and conversation logs in your Parent Dashboard</li>
              <li>Improve Yoluno's safety filters and content quality using aggregated, anonymised patterns — never individual children's data</li>
            </ul>
            <h3 className="font-body text-[16px] font-semibold text-foreground mt-7 mb-3">What we never do with it:</h3>
            <ul className="list-disc pl-5 space-y-2 font-body text-[15px] text-muted-foreground leading-[1.7] marker:text-muted-foreground/50">
              <li>Sell or share children's data with third parties</li>
              <li>Use children's data for advertising, profiling, or targeting</li>
              <li>Use identifiable children's data to train AI models</li>
              <li>Share data with schools, educators, or any institution without explicit parent consent</li>
              <li>Retain data after account deletion</li>
            </ul>
            <h3 className="font-body text-[16px] font-semibold text-foreground mt-7 mb-3">Data retention:</h3>
            <p className="font-body text-[16px] text-muted-foreground leading-[1.75] mb-6">
              Conversation logs are stored for the duration of your subscription unless you delete them sooner. You can delete individual conversations, family memories, or your child's entire profile at any time. Account deletion permanently removes all associated data within 30 days. You can export all your data before deletion.
            </p>
            <h3 className="font-body text-[16px] font-semibold text-foreground mt-7 mb-3">Data storage:</h3>
            <p className="font-body text-[16px] text-muted-foreground leading-[1.75]">
              All data is encrypted in transit and at rest. For full technical details, read our Data Practices page.
            </p>
          </section>

          {/* Section 8 */}
          <section id="parent-controls" ref={setRef("parent-controls")} className="mb-16 scroll-mt-24">
            <h2 className="font-heading text-[28px] text-foreground mb-5">8. Parent Controls</h2>
            <p className="font-body text-[16px] text-muted-foreground leading-[1.75] mb-6">
              Parents govern every aspect of their child's experience through the Parent Dashboard.
            </p>
            <h3 className="font-body text-[16px] font-semibold text-foreground mt-7 mb-3">Set boundaries:</h3>
            <ul className="list-disc pl-5 space-y-2 font-body text-[15px] text-muted-foreground leading-[1.7] marker:text-muted-foreground/50">
              <li>Enable or disable topic categories per child</li>
              <li>Adjust Luno's personality traits per child</li>
              <li>Set session time limits</li>
              <li>Control which features each child can access</li>
            </ul>
            <h3 className="font-body text-[16px] font-semibold text-foreground mt-7 mb-3">Monitor activity:</h3>
            <ul className="list-disc pl-5 space-y-2 font-body text-[15px] text-muted-foreground leading-[1.7] marker:text-muted-foreground/50">
              <li>View full conversation logs</li>
              <li>See mood check-in history and patterns</li>
              <li>Review stories, journeys, and family space activity</li>
              <li>Receive weekly summary emails</li>
            </ul>
            <h3 className="font-body text-[16px] font-semibold text-foreground mt-7 mb-3">Take action:</h3>
            <ul className="list-disc pl-5 space-y-2 font-body text-[15px] text-muted-foreground leading-[1.7] marker:text-muted-foreground/50">
              <li>Flag any AI response for safety review</li>
              <li>Delete any conversation, story, or family memory</li>
              <li>Adjust boundaries at any time — changes take effect immediately</li>
              <li>Delete a child's profile and all associated data permanently</li>
              <li>Export all data at any time</li>
            </ul>
          </section>

          {/* Section 9 */}
          <section id="when-things-go-wrong" ref={setRef("when-things-go-wrong")} className="mb-16 scroll-mt-24">
            <h2 className="font-heading text-[28px] text-foreground mb-8">9. When Things Go Wrong</h2>
            <div className="space-y-4">
              {[
                {
                  title: "If the AI generates an inappropriate response:",
                  body: "The parent can flag it from the Dashboard. Our safety team reviews flagged content within 24 hours. Patterns in flagged content are used to improve safety filters. If a systemic issue is identified, we deploy fixes and notify affected parents.",
                },
                {
                  title: "If a child is distressed:",
                  body: "Yoluno pauses, responds gently, and encourages the child to talk to a parent or trusted adult. The parent is notified in the Dashboard. Yoluno does not attempt to provide crisis support.",
                },
                {
                  title: "If a parent disagrees with how a topic was handled:",
                  body: "The parent can adjust topic boundaries, personality settings, or feature access at any time. Changes take effect immediately. If the concern is about a specific response, flagging it ensures our team reviews it.",
                },
                {
                  title: "If you find a safety vulnerability:",
                  body: "Contact us directly at safety@yoluno.com. We take every report seriously and will respond within 24 hours.",
                },
                {
                  title: "If Yoluno ever discontinues service:",
                  body: "You will receive at least 90 days' notice. During that period, you can export all data in standard, open formats. After the notice period, all data is permanently deleted. This commitment is documented in our Terms of Service.",
                },
              ].map((card, i) => (
                <div key={i} className="bg-card border border-border rounded-xl p-6">
                  <h3 className="font-body text-[16px] font-semibold text-foreground mb-2">{card.title}</h3>
                  <p className="font-body text-[15px] text-muted-foreground leading-[1.7]">{card.body}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Section 10 */}
          <section id="our-commitments" ref={setRef("our-commitments")} className="mb-16 scroll-mt-24">
            <h2 className="font-heading text-[28px] text-foreground mb-8">10. Our Commitments</h2>
            <ol className="space-y-6 list-none">
              {[
                { title: "Children's safety comes first.", desc: "Every product decision is evaluated against its impact on child safety. If a feature cannot be made safe, it does not ship." },
                { title: "The AI is transparent.", desc: "Parents can always see what the AI said, how it responded, and what boundaries were in effect." },
                { title: "The AI is bounded.", desc: "Yoluno's AI operates within a closed system with no internet access and no ability to communicate outside its own environment." },
                { title: "Parents are in charge.", desc: "No default setting, no AI behaviour, and no product feature operates outside the boundaries a parent has set." },
                { title: "Data belongs to families.", desc: "Children's data is never sold, shared with third parties, or used to train external AI models. Families can access, export, or delete all their data at any time." },
                { title: "We will be honest about failures.", desc: "When the AI gets something wrong — and it will — we will acknowledge it, fix it, and tell affected parents what happened and what we changed." },
              ].map((c, i) => (
                <li key={i} className="font-body text-[16px] leading-[1.75]">
                  <span className="font-semibold text-foreground">{i + 1}. {c.title}</span>{" "}
                  <span className="text-muted-foreground">{c.desc}</span>
                </li>
              ))}
            </ol>
          </section>

          {/* Section 11 */}
          <section id="how-to-reach-us" ref={setRef("how-to-reach-us")} className="mb-16 scroll-mt-24">
            <h2 className="font-heading text-[28px] text-foreground mb-8">11. How to Reach Us</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                { emoji: "🛡️", type: "Safety Concerns", email: "safety@yoluno.com", note: "Responses within 24 hours" },
                { emoji: "🔒", type: "Data Requests", email: "privacy@yoluno.com", note: "Access, deletion, or export" },
                { emoji: "💬", type: "General", email: "hello@yoluno.com", note: "Everything else" },
              ].map((c, i) => (
                <div key={i} className="bg-card border border-border rounded-xl p-6 text-center">
                  <span className="text-2xl block mb-3">{c.emoji}</span>
                  <h3 className="font-body text-[15px] font-bold text-foreground mb-1">{c.type}</h3>
                  <a href={`mailto:${c.email}`} className="text-primary font-body text-[14px] hover:underline block mb-2">{c.email}</a>
                  <p className="font-body text-[13px] text-muted-foreground">{c.note}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Section 12 */}
          <section id="how-this-charter-is-updated" ref={setRef("how-this-charter-is-updated")} className="mb-16 scroll-mt-24">
            <h2 className="font-heading text-[28px] text-foreground mb-5">12. How This Charter Is Updated</h2>
            <p className="font-body text-[16px] text-muted-foreground leading-[1.75] mb-6">
              This charter is a living document. We update it when the product changes, when we learn something new, or when regulations evolve.
            </p>
            <h3 className="font-body text-[16px] font-semibold text-foreground mt-7 mb-3">When we update this charter, we will:</h3>
            <ul className="list-disc pl-5 space-y-2 font-body text-[15px] text-muted-foreground leading-[1.7] marker:text-muted-foreground/50">
              <li>Note the date of the last update at the top of this page</li>
              <li>Summarise what changed and why</li>
              <li>Notify all registered parents by email if the changes are significant</li>
              <li>Never reduce protections without clear justification and advance notice</li>
            </ul>
            <p className="font-body text-[16px] text-muted-foreground leading-[1.75] mt-6">
              You can view previous versions of this charter by contacting <a href="mailto:contact@yoluno.com" className="text-primary hover:underline">contact@yoluno.com</a>.
            </p>
          </section>

          {/* Bottom CTA */}
          <hr className="border-border my-12" />
          <div className="text-center py-8">
            <h2 className="font-heading text-[28px] text-foreground mb-4">Questions?</h2>
            <p className="font-body text-[16px] text-muted-foreground leading-[1.75] max-w-[560px] mx-auto mb-4">
              If anything in this charter is unclear, or if you have a concern that isn't addressed here, please contact us. We'd rather answer a difficult question than leave it unasked.
            </p>
            <a href="mailto:safety@yoluno.com" className="text-primary font-body text-[16px] font-medium hover:underline">
              safety@yoluno.com
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
