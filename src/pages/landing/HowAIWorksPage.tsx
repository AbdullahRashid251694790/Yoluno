import { useState, useEffect } from "react";
import { useIsMobile } from "@/hooks/useIsMobile";
import { ChevronDown } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const sections = [
  { id: "what-kind-of-ai", label: "What Kind of AI?" },
  { id: "how-a-conversation-works", label: "How a Conversation Works" },
  { id: "what-the-ai-can-do", label: "What the AI Can Do" },
  { id: "what-the-ai-cannot-do", label: "What the AI Cannot Do" },
  { id: "what-the-ai-will-never-do", label: "What the AI Will Never Do" },
  { id: "how-safety-filters-work", label: "How Safety Filters Work" },
  { id: "what-parents-can-control", label: "What Parents Can Control" },
  { id: "honest-limitations", label: "The Honest Limitations" },
  { id: "faq", label: "FAQ" },
];

const safetyLayers = [
  {
    num: 1,
    title: "Input filtering",
    desc: "Before the AI processes a child's message, it's checked against restricted topics, concerning patterns, and known edge cases. Flagged inputs are redirected before the AI generates a response.",
  },
  {
    num: 2,
    title: "Prompt architecture",
    desc: "The AI's underlying instructions include detailed safety rules that govern every response. These instructions tell the AI to stay within age-appropriate boundaries and never generate restricted content.",
  },
  {
    num: 3,
    title: "Output filtering",
    desc: "After the AI generates a response, it's checked again before the child sees it. This catches anything that slipped through the prompt-level protections.",
  },
  {
    num: 4,
    title: "Parent-configured boundaries",
    desc: "Your topic settings and feature controls add a final layer. Even if content would pass the first three layers, it's blocked if you've disabled that topic for your child.",
  },
  {
    num: 5,
    title: "Human review",
    desc: "When you flag a response from the Parent Dashboard, our safety team reviews it within 24 hours. Patterns in flagged content are used to update and strengthen all four automated layers.",
  },
];

const limitations = [
  {
    title: "AI can produce unexpected outputs",
    body: "Despite multiple layers of filtering, language models can occasionally generate responses that are inaccurate, inappropriate, or not what you'd want your child to see. This is a known limitation of all current AI technology.",
  },
  {
    title: "Filters are not perfect",
    body: "Our safety filters catch the vast majority of problematic content, but no filter is 100% effective. This is why parent visibility and flagging exist — they're a necessary complement to automated safety.",
  },
  {
    title: "The AI doesn't 'understand' things",
    body: "When Luno explains why the sky is blue, it's generating a response based on patterns in its training data — not understanding physics. Responses are usually accurate and helpful, but they can sometimes be wrong or oversimplified.",
  },
  {
    title: "Children can be creative",
    body: "A determined child may find ways to phrase questions that test the boundaries of safety filters. We continuously update our filters based on real-world usage, but we can't guarantee we've anticipated every approach.",
  },
];

const faqs = [
  {
    q: "Is Yoluno's AI the same as ChatGPT?",
    a: "No. Yoluno uses language model technology from the same family, but it's configured specifically for children with safety filters, age adaptation, and content boundaries that don't exist in general-purpose AI tools. Yoluno is also a closed system with no internet access.",
  },
  {
    q: "Can the AI access my child's other apps or data?",
    a: "No. Yoluno operates in a sandboxed environment with no access to other apps, files, or data on your child's device.",
  },
  {
    q: "Can the AI see or access family photos and voice recordings?",
    a: "The AI can present Family space content to your child, but it cannot analyse, modify, or learn from it. Family content is never used for training.",
  },
  {
    q: "Does the AI get smarter from my child's conversations?",
    a: "No. Your child's individual conversations are not fed back into the AI model.",
  },
  {
    q: "What happens if the AI says something wrong?",
    a: "Flag it from your Parent Dashboard. Our safety team will review it within 24 hours. If we identify a systemic issue, we'll update our filters and notify affected parents.",
  },
  {
    q: "Can I turn off the AI entirely and just use the Family space?",
    a: "Yes. You can disable Chat, Stories, and Journeys per child, leaving only the Family space accessible.",
  },
];

export default function HowAIWorksPage() {
  const isMobile = useIsMobile();
  const [activeSection, setActiveSection] = useState(sections[0].id);
  const [tocOpen, setTocOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      for (let i = sections.length - 1; i >= 0; i--) {
        const el = document.getElementById(sections[i].id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 120) {
            setActiveSection(sections[i].id);
            break;
          }
        }
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setTocOpen(false);
    }
  };

  const Divider = () => (
    <hr className="border-t my-12" style={{ borderColor: "#E8E6E1" }} />
  );

  const SectionHeading = ({ id, children }: { id: string; children: React.ReactNode }) => (
    <h2
      id={id}
      className="font-heading scroll-mt-24"
      style={{ fontSize: 28, color: "#2A2926", marginBottom: 20 }}
    >
      {children}
    </h2>
  );

  const SubHeading = ({ children }: { children: React.ReactNode }) => (
    <h3
      className="font-body font-semibold"
      style={{ fontSize: 16, color: "#2A2926", marginTop: 28, marginBottom: 12 }}
    >
      {children}
    </h3>
  );

  const Body = ({ children }: { children: React.ReactNode }) => (
    <p className="font-body" style={{ fontSize: 16, color: "#2A2926", lineHeight: 1.75 }}>
      {children}
    </p>
  );

  const BulletList = ({ items }: { items: string[] }) => (
    <ul className="font-body space-y-2 pl-5" style={{ fontSize: 15, color: "#6B675E", lineHeight: 1.7, listStyleType: "disc" }}>
      {items.map((item, i) => (
        <li key={i} className="marker:text-[#9B978E]">{item}</li>
      ))}
    </ul>
  );

  return (
    <main className="pt-20" style={{ backgroundColor: "#FAFAF7" }}>
      <div className="relative max-w-[1200px] mx-auto px-6 md:px-12">
        {/* Sticky TOC — desktop */}
        {!isMobile && (
          <nav className="hidden lg:block fixed top-28 w-48" style={{ left: "max(1rem, calc((100vw - 1200px) / 2))" }}>
            <ul className="space-y-2">
              {sections.map((s) => (
                <li key={s.id}>
                  <button
                    onClick={() => scrollTo(s.id)}
                    className="text-left font-body transition-colors w-full"
                    style={{
                      fontSize: 13,
                      color: activeSection === s.id ? "#3ECDC6" : "#9B978E",
                      fontWeight: activeSection === s.id ? 600 : 400,
                    }}
                  >
                    {s.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        )}

        {/* Content */}
        <div className="max-w-[800px] mx-auto" style={{ paddingTop: 80, paddingBottom: 100 }}>
          {/* Hero */}
          <p
            className="font-body font-semibold uppercase mb-4"
            style={{ fontSize: 12.5, letterSpacing: 2.5, color: "#3ECDC6" }}
          >
            HOW AI WORKS
          </p>
          <h1
            className="font-heading mb-6"
            style={{ fontSize: 44, color: "#2A2926" }}
          >
            How AI Works in Yoluno
          </h1>
          <p
            className="font-body mb-6"
            style={{ fontSize: 17, color: "#6B675E", lineHeight: 1.7 }}
          >
            Yoluno is built on AI. If you're trusting us with your child's curiosity, you deserve to understand exactly how that AI works — what it does, what it doesn't, how it's kept safe, and what you can control.
          </p>
          <p className="font-body" style={{ fontSize: 13, color: "#9B978E" }}>
            Last updated: April 2026
          </p>

          {/* Mobile TOC */}
          {isMobile && (
            <div className="mt-8 mb-4">
              <button
                onClick={() => setTocOpen(!tocOpen)}
                className="flex items-center justify-between w-full font-body font-semibold py-3 px-4 rounded-lg border"
                style={{ fontSize: 14, color: "#2A2926", borderColor: "#E8E6E1", backgroundColor: "#F5F3EE" }}
              >
                Table of Contents
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${tocOpen ? "rotate-180" : ""}`}
                  style={{ color: "#9B978E" }}
                />
              </button>
              {tocOpen && (
                <ul className="mt-2 space-y-1 px-4 pb-2" style={{ backgroundColor: "#F5F3EE", borderRadius: 8 }}>
                  {sections.map((s) => (
                    <li key={s.id}>
                      <button
                        onClick={() => scrollTo(s.id)}
                        className="font-body py-1.5 w-full text-left"
                        style={{
                          fontSize: 13,
                          color: activeSection === s.id ? "#3ECDC6" : "#9B978E",
                        }}
                      >
                        {s.label}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <Divider />

          {/* Section 1 */}
          <SectionHeading id="what-kind-of-ai">What Kind of AI Does Yoluno Use?</SectionHeading>
          <Body>
            Yoluno uses large language models — the same category of technology behind tools like ChatGPT, Gemini, and Claude. These are AI systems trained on large amounts of text that can generate human-like responses to questions and prompts.
          </Body>
          <Body>
            However, Yoluno's AI is not the same as those tools. Here's what makes it different:
          </Body>
          <SubHeading>It's configured specifically for children.</SubHeading>
          <Body>
            The language, complexity, and emotional tone of every response are adapted based on your child's age. A 5-year-old and a 12-year-old get fundamentally different experiences.
          </Body>
          <SubHeading>It's filtered for safety.</SubHeading>
          <Body>
            Every input from your child and every output from the AI passes through safety filters designed specifically for children. These filters block inappropriate content before it reaches your child.
          </Body>
          <SubHeading>It's closed.</SubHeading>
          <Body>
            Yoluno's AI has no access to the internet. It cannot search the web, follow links, or pull in content from external sources. It operates entirely within a self-contained system.
          </Body>
          <SubHeading>It's governed by parents.</SubHeading>
          <Body>
            You set the topic boundaries, personality traits, and feature access for each child. The AI operates within these boundaries and cannot override them.
          </Body>

          <Divider />

          {/* Section 2 */}
          <SectionHeading id="how-a-conversation-works">How a Conversation Works — Step by Step</SectionHeading>
          <Body>
            Here's what happens when your child interacts with Yoluno, from the moment they type or speak to the moment they see a response:
          </Body>
          <SubHeading>Step 1: Your child says something</SubHeading>
          <Body>
            They type a question, continue a story, or respond to a journey prompt. This input is sent to Yoluno's servers over an encrypted connection.
          </Body>
          <SubHeading>Step 2: Input safety check</SubHeading>
          <Body>
            Before the AI processes anything, the input passes through a safety filter. This checks for content that might indicate distress, attempts to discuss restricted topics, or patterns that require special handling. If the input triggers a safety flag, the AI may respond with a gentle redirect instead of a direct answer. You'll see this in your Parent Dashboard.
          </Body>
          <SubHeading>Step 3: AI generates a response</SubHeading>
          <Body>
            The AI considers your child's message alongside several factors: the child's age (which determines vocabulary, tone, and depth), the parent-configured topic boundaries (which determine what the AI can and cannot discuss), the personality settings you've chosen for Luno (curiosity level, patience, playfulness), and the conversation context (what's been discussed in this session). The AI then generates a response. This is not a pre-written script — it's created in real time, specifically for your child's question.
          </Body>
          <SubHeading>Step 4: Output safety check</SubHeading>
          <Body>
            Before your child sees the response, it passes through a second layer of safety filtering. This catches anything the AI may have generated that doesn't meet our content standards. If the output is flagged, the AI generates an alternative response that stays within boundaries.
          </Body>
          <SubHeading>Step 5: Your child sees the response</SubHeading>
          <Body>The filtered response is displayed to your child.</Body>
          <SubHeading>Step 6: Everything is logged</SubHeading>
          <Body>
            The full exchange — your child's input and the AI's response — is saved to your Parent Dashboard. You can review it at any time.
          </Body>

          <Divider />

          {/* Section 3 */}
          <SectionHeading id="what-the-ai-can-do">What the AI Can Do</SectionHeading>
          <SubHeading>Answer questions</SubHeading>
          <Body>
            Across a wide range of topics including science, nature, history, art, emotions, maths, and more. The depth and vocabulary adapt to the child's age.
          </Body>
          <SubHeading>Co-create stories</SubHeading>
          <Body>
            In the Stories space, the AI (through Lumi) helps your child build narratives by offering choices, suggesting characters, and following the child's creative direction. The child decides what happens; the AI helps it come alive.
          </Body>
          <SubHeading>Guide reflections</SubHeading>
          <Body>
            In the Journeys space, the AI (through Lolo) delivers gentle prompts about feelings, habits, and personal growth. These are not therapeutic interventions — they're invitations to reflect.
          </Body>
          <SubHeading>Present family content</SubHeading>
          <Body>
            In the Family space, the AI (through Loti) helps children navigate voice recordings, photos, and stories uploaded by parents. The AI presents this content but does not generate, alter, or fabricate any of it.
          </Body>
          <SubHeading>Adapt to mood</SubHeading>
          <Body>
            Based on the mood check-in at the start of each session, the AI adjusts its tone and suggestions. A child who says they're feeling sad gets gentler options. A child who's excited gets more energy.
          </Body>

          <Divider />

          {/* Section 4 */}
          <SectionHeading id="what-the-ai-cannot-do">What the AI Cannot Do</SectionHeading>
          <Body>
            These are not settings — they are architectural constraints built into the system:
          </Body>
          <div className="mt-4">
            <BulletList
              items={[
                "Cannot access the internet. There is no network connection between Yoluno's AI and the outside world.",
                "Cannot communicate outside Yoluno. The AI cannot send messages, emails, or data to any external service, user, or platform.",
                "Cannot remember across sessions (by default). Unless you enable conversation memory in your settings, each session starts fresh.",
                "Cannot override parent settings. If you've disabled a topic or restricted a feature, the AI cannot access it regardless of what the child asks.",
                "Cannot identify who your child is beyond their first name and age.",
              ]}
            />
          </div>

          <Divider />

          {/* Section 5 — special block */}
          <SectionHeading id="what-the-ai-will-never-do">What the AI Will Never Do</SectionHeading>
          <div
            className="mt-4 rounded-none"
            style={{
              backgroundColor: "#F5F3EE",
              borderLeft: "3px solid #E8946A",
              padding: 24,
            }}
          >
            <Body>These are absolute commitments, enforced by both technology and policy:</Body>
            <div className="mt-4">
              <BulletList
                items={[
                  "Never encourage secrecy. The AI will never tell a child to keep something from their parents or trusted adults.",
                  "Never provide professional advice. The AI will not provide medical, legal, psychiatric, or therapeutic advice.",
                  "Never generate harmful content. The AI is filtered to prevent sexual, violent, self-harm-related, or otherwise age-inappropriate content.",
                  "Never attempt emotional bonding. Yoluno's characters are guides, not friends or companions. The AI will not tell a child it loves them, misses them, or has feelings.",
                  "Never collect biometric data. The AI does not process facial recognition, voice prints, or fingerprints.",
                ]}
              />
            </div>
          </div>

          <Divider />

          {/* Section 6 — safety layers */}
          <SectionHeading id="how-safety-filters-work">How Safety Filters Work</SectionHeading>
          <Body>
            Yoluno uses multiple layers of safety filtering. Each layer operates independently, so a failure in one doesn't compromise the others:
          </Body>
          <div className="mt-8 space-y-6">
            {safetyLayers.map((layer) => (
              <div key={layer.num} className="flex gap-4 items-start">
                <div
                  className="flex-shrink-0 flex items-center justify-center rounded-full font-body font-bold"
                  style={{
                    width: 40,
                    height: 40,
                    backgroundColor: "#E8F6F4",
                    color: "#3ECDC6",
                    fontSize: 16,
                  }}
                >
                  {layer.num}
                </div>
                <div>
                  <h4 className="font-body font-semibold" style={{ fontSize: 16, color: "#2A2926", marginBottom: 4 }}>
                    {layer.title}
                  </h4>
                  <p className="font-body" style={{ fontSize: 15, color: "#6B675E", lineHeight: 1.7 }}>
                    {layer.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <Divider />

          {/* Section 7 */}
          <SectionHeading id="what-parents-can-control">What Parents Can Control</SectionHeading>
          <Body>From the Parent Dashboard, you have direct control over:</Body>
          <SubHeading>Topic categories</SubHeading>
          <Body>Enable or disable entire subject areas per child. Disabled topics are blocked at the system level.</Body>
          <SubHeading>Custom topics</SubHeading>
          <Body>Add your own topics with custom content for Luno to reference in conversations.</Body>
          <SubHeading>Personality traits</SubHeading>
          <Body>Adjust sliders for Curiosity, Patience, and Playfulness to shape how Luno interacts with each child.</Body>
          <SubHeading>Feature access</SubHeading>
          <Body>Control which spaces each child can access — Chat, Stories, Journeys, Family.</Body>
          <SubHeading>Conversation memory</SubHeading>
          <Body>Choose whether the AI remembers previous conversations or starts fresh each time.</Body>
          <SubHeading>Data management</SubHeading>
          <Body>View, export, or delete any conversation, story, journey, or family content at any time.</Body>

          <Divider />

          {/* Section 8 — limitation cards */}
          <SectionHeading id="honest-limitations">The Honest Limitations</SectionHeading>
          <Body>We believe in being transparent about what AI cannot guarantee:</Body>
          <div className="mt-6 space-y-4">
            {limitations.map((lim, i) => (
              <div
                key={i}
                className="bg-white rounded-xl p-6"
                style={{ border: "1px solid #E8E6E1" }}
              >
                <h4 className="font-body font-semibold mb-2" style={{ fontSize: 16, color: "#2A2926" }}>
                  {lim.title}
                </h4>
                <p className="font-body" style={{ fontSize: 15, color: "#6B675E", lineHeight: 1.7 }}>
                  {lim.body}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-8">
            <Body>
              What we do about it: We commit to transparency (you see everything), accountability (flag anything, we review within 24 hours), and continuous improvement (every flag makes the system better). We cannot promise perfection. We can promise honesty about the limitations and a team that takes every concern seriously.
            </Body>
          </div>

          <Divider />

          {/* Section 9 — FAQ */}
          <SectionHeading id="faq">Frequently Asked Questions</SectionHeading>
          <Accordion type="single" collapsible className="mt-4">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="border-b" style={{ borderColor: "#E8E6E1" }}>
                <AccordionTrigger
                  className="font-body font-semibold hover:no-underline py-5"
                  style={{ fontSize: 16, color: "#2A2926" }}
                >
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent>
                  <p className="font-body pb-2" style={{ fontSize: 15, color: "#6B675E", lineHeight: 1.7 }}>
                    {faq.a}
                  </p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <Divider />

          {/* Bottom CTA */}
          <div className="text-center">
            <h2 className="font-heading" style={{ fontSize: 28, color: "#2A2926", marginBottom: 16 }}>
              Questions?
            </h2>
            <p className="font-body" style={{ fontSize: 16, color: "#6B675E" }}>
              If you want to know anything about how AI works in Yoluno that we haven't covered here, email us:{" "}
              <a href="mailto:hello@yoluno.com" className="text-primary hover:underline">hello@yoluno.com</a>
            </p>
            <p className="font-body mt-2" style={{ fontSize: 16, color: "#6B675E" }}>
              We'd rather answer a difficult question than leave it unasked.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
