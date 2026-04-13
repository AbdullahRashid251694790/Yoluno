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
  { id: "data-lifecycle", label: "The Data Lifecycle" },
  { id: "data-we-never-touch", label: "Data We Never Touch" },
  { id: "specific-data-types", label: "Specific Data Types" },
  { id: "if-yoluno-shuts-down", label: "If Yoluno Shuts Down" },
  { id: "exercise-your-rights", label: "Exercise Your Rights" },
];

const dataRights = [
  { action: "View your data", how: "Log into your Parent Dashboard. All data is visible and browsable." },
  { action: "Export your data", how: "Parent Dashboard → Settings → Export Data. Available in standard formats." },
  { action: "Delete specific data", how: "Navigate to any conversation, story, journey, or Family space item and select Delete." },
  { action: "Delete a child's profile", how: "Parent Dashboard → Children → Select child → Delete Profile." },
  { action: "Delete your account", how: "Parent Dashboard → Settings → Delete Account." },
  { action: "Request anything else", how: "Email privacy@yoluno.com. We respond within 30 days." },
];

export default function DataPracticesPage() {
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

  const Divider = () => <hr className="border-t my-12" style={{ borderColor: "#E8E6E1" }} />;

  const SectionHeading = ({ id, children }: { id: string; children: React.ReactNode }) => (
    <h2 id={id} className="font-heading scroll-mt-24" style={{ fontSize: 28, color: "#2A2926", marginBottom: 20 }}>
      {children}
    </h2>
  );

  const SubHeading = ({ children }: { children: React.ReactNode }) => (
    <h3 className="font-body font-semibold" style={{ fontSize: 16, color: "#2A2926", marginTop: 28, marginBottom: 12 }}>
      {children}
    </h3>
  );

  const Body = ({ children }: { children: React.ReactNode }) => (
    <p className="font-body" style={{ fontSize: 16, color: "#2A2926", lineHeight: 1.75 }}>
      {children}
    </p>
  );

  return (
    <main className="pt-20" style={{ backgroundColor: "#FAFAF7" }}>
      <div className="relative max-w-[1200px] mx-auto px-6 md:px-12">
        {/* Desktop TOC */}
        {!isMobile && (
          <nav className="hidden lg:block fixed top-28 w-48" style={{ left: "max(1rem, calc((100vw - 1200px) / 2))" }}>
            <ul className="space-y-2">
              {sections.map((s) => (
                <li key={s.id}>
                  <button
                    onClick={() => scrollTo(s.id)}
                    className="text-left font-body transition-colors w-full"
                    style={{ fontSize: 13, color: activeSection === s.id ? "#3ECDC6" : "#9B978E", fontWeight: activeSection === s.id ? 600 : 400 }}
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
          <p className="font-body font-semibold uppercase mb-4" style={{ fontSize: 12.5, letterSpacing: 2.5, color: "#3ECDC6" }}>
            DATA PRACTICES
          </p>
          <h1 className="font-heading mb-6" style={{ fontSize: 44, color: "#2A2926" }}>
            Data Practices
          </h1>
          <p className="font-body mb-3" style={{ fontSize: 17, color: "#6B675E", lineHeight: 1.7 }}>
            Our Privacy Policy covers the legal framework. This page covers the practical reality: what data flows through Yoluno, what happens to it at every stage, and how you control it.
          </p>
          <p className="font-body italic mb-6" style={{ fontSize: 17, color: "#6B675E", lineHeight: 1.7 }}>
            If the Privacy Policy is the contract, this page is the explanation.
          </p>
          <p className="font-body" style={{ fontSize: 13, color: "#9B978E" }}>Last updated: April 2026</p>

          {/* Mobile TOC */}
          {isMobile && (
            <div className="mt-8 mb-4">
              <button
                onClick={() => setTocOpen(!tocOpen)}
                className="flex items-center justify-between w-full font-body font-semibold py-3 px-4 rounded-lg border"
                style={{ fontSize: 14, color: "#2A2926", borderColor: "#E8E6E1", backgroundColor: "#F5F3EE" }}
              >
                Table of Contents
                <ChevronDown className={`h-4 w-4 transition-transform ${tocOpen ? "rotate-180" : ""}`} style={{ color: "#9B978E" }} />
              </button>
              {tocOpen && (
                <ul className="mt-2 space-y-1 px-4 pb-2" style={{ backgroundColor: "#F5F3EE", borderRadius: 8 }}>
                  {sections.map((s) => (
                    <li key={s.id}>
                      <button onClick={() => scrollTo(s.id)} className="font-body py-1.5 w-full text-left" style={{ fontSize: 13, color: activeSection === s.id ? "#3ECDC6" : "#9B978E" }}>
                        {s.label}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <Divider />

          {/* Section 1 — Data Lifecycle */}
          <SectionHeading id="data-lifecycle">The Data Lifecycle</SectionHeading>
          <Body>Every piece of data in Yoluno follows a clear path. Here's what happens at each stage.</Body>

          {/* Stage 1 */}
          <div className="flex gap-4 items-start mt-10">
            <div className="flex-shrink-0 flex items-center justify-center rounded-full font-body font-bold" style={{ width: 48, height: 48, backgroundColor: "#E8F6F4", color: "#3ECDC6", fontSize: 20 }}>1</div>
            <h3 className="font-heading mt-2" style={{ fontSize: 22, color: "#2A2926" }}>Collection</h3>
          </div>
          <div className="ml-16 mt-4">
            <SubHeading>What's collected and when:</SubHeading>
            <Body>When a parent creates an account: email address, password (encrypted), payment information (processed by our payment provider, never stored by us).</Body>
            <div className="mt-3"><Body>When a parent creates a child profile: first name, surname, and age. A profile photo can be uploaded by the parent or the child as their avatar.</Body></div>
            <div className="mt-3"><Body>When a child uses Yoluno: the text of their conversations with Luno, Lumi, Lolo, and Loti. Their mood check-in responses. The story content they co-create. Their journey progress and reflections.</Body></div>
            <div className="mt-3"><Body>When a parent uploads to the Family space: voice recordings, photos, and written stories. Only parents can upload to the Family space. Children can view but not add content to this space.</Body></div>
            <SubHeading>What's NOT collected:</SubHeading>
            <Body>Home address, school name, or location data. Biometric data (fingerprints, facial recognition, voice prints). Contact lists, browsing history, or data from other apps. Advertising identifiers.</Body>
          </div>

          {/* Stage 2 */}
          <div className="flex gap-4 items-start mt-10">
            <div className="flex-shrink-0 flex items-center justify-center rounded-full font-body font-bold" style={{ width: 48, height: 48, backgroundColor: "#E8F6F4", color: "#3ECDC6", fontSize: 20 }}>2</div>
            <h3 className="font-heading mt-2" style={{ fontSize: 22, color: "#2A2926" }}>Processing</h3>
          </div>
          <div className="ml-16 mt-4">
            <SubHeading>How data is used in real time:</SubHeading>
            <Body>When your child sends a message to Luno, the text is processed by Yoluno's AI within our closed system. The AI generates a response based on your child's age, the topic boundaries you've set, and Luno's personality configuration. Both the child's message and the AI's response pass through safety filters. The exchange is then stored so you can review it in your Dashboard.</Body>
            <div className="mt-3"><Body>The AI does not send data to external servers. Processing happens entirely within Yoluno's infrastructure. Nothing goes to the open internet.</Body></div>
            <SubHeading>How data is used for improvement:</SubHeading>
            <Body>We analyse aggregated, anonymised patterns — like which types of questions trigger safety redirects most often, or which age groups engage most with certain features. This helps us improve safety filters and the overall experience.</Body>
            <div className="mt-3"><Body>We do not analyse individual children's conversations for product improvement. We do not read your child's conversations unless you flag a specific response for safety review.</Body></div>
          </div>

          {/* Stage 3 */}
          <div className="flex gap-4 items-start mt-10">
            <div className="flex-shrink-0 flex items-center justify-center rounded-full font-body font-bold" style={{ width: 48, height: 48, backgroundColor: "#E8F6F4", color: "#3ECDC6", fontSize: 20 }}>3</div>
            <h3 className="font-heading mt-2" style={{ fontSize: 22, color: "#2A2926" }}>Storage</h3>
          </div>
          <div className="ml-16 mt-4">
            <SubHeading>Where data lives:</SubHeading>
            <Body>All data is stored on encrypted servers, encrypted at rest using AES-256 encryption. Data in transit is encrypted using TLS 1.2+.</Body>
            <SubHeading>How data is organised:</SubHeading>
            <Body>Each family's data is isolated. There is no cross-family access. Parent account data, child profile data, and Family space content are stored separately and linked only through your account credentials.</Body>
            <SubHeading>Who can access stored data:</SubHeading>
            <Body>You (through the Parent Dashboard). Your children (through the Yoluno app, limited to their own profile's content). Authorised Yoluno team members (for support and safety review, logged and audited). No one else.</Body>
          </div>

          {/* Stage 4 */}
          <div className="flex gap-4 items-start mt-10">
            <div className="flex-shrink-0 flex items-center justify-center rounded-full font-body font-bold" style={{ width: 48, height: 48, backgroundColor: "#E8F6F4", color: "#3ECDC6", fontSize: 20 }}>4</div>
            <h3 className="font-heading mt-2" style={{ fontSize: 22, color: "#2A2926" }}>Deletion</h3>
          </div>
          <div className="ml-16 mt-4">
            <SubHeading>You control deletion:</SubHeading>
            <Body>Individual conversations: delete anytime from the Dashboard. Deleted immediately from our servers.</Body>
            <div className="mt-3"><Body>Individual Family space items: delete anytime from the Dashboard. Deleted immediately. No copies retained.</Body></div>
            <div className="mt-3"><Body>Auto-deletion: set conversations to automatically delete after 30, 60, or 90 days in your Dashboard settings.</Body></div>
            <div className="mt-3"><Body>Child profile: delete a child's entire profile and all associated data anytime. Completed within 30 days.</Body></div>
            <div className="mt-3"><Body>Full account: delete your account and all data for all child profiles. Completed within 30 days.</Body></div>
            <SubHeading>What 'deleted' means:</SubHeading>
            <Body>When you delete data in Yoluno, it is permanently removed from our active servers and backup systems. We do not retain copies. We do not move deleted data to a separate archive. Deletion is real and irreversible.</Body>
          </div>

          <Divider />

          {/* Section 2 — Data We Never Touch (coral block) */}
          <SectionHeading id="data-we-never-touch">Data We Never Touch</SectionHeading>
          <div className="mt-4 rounded-none" style={{ backgroundColor: "#F5F3EE", borderLeft: "3px solid #E8946A", padding: 24 }}>
            <Body>These are not aspirations. They are architectural decisions:</Body>

            <h3 className="font-body font-semibold mt-6 mb-3" style={{ fontSize: 16, color: "#2A2926" }}>No advertising data</h3>
            <p className="font-body" style={{ fontSize: 16, color: "#2A2926", lineHeight: 1.75 }}>There is no advertising system in Yoluno. No ad server. No tracking pixel. No advertising SDK. We cannot serve ads because we have not built the infrastructure to do so.</p>

            <h3 className="font-body font-semibold mt-6 mb-3" style={{ fontSize: 16, color: "#2A2926" }}>No third-party analytics</h3>
            <p className="font-body" style={{ fontSize: 16, color: "#2A2926", lineHeight: 1.75 }}>We do not use Google Analytics, Facebook Pixel, Mixpanel, or any third-party analytics tool that transmits data to external companies. Our analytics are internal and aggregate only.</p>

            <h3 className="font-body font-semibold mt-6 mb-3" style={{ fontSize: 16, color: "#2A2926" }}>No data broker relationships</h3>
            <p className="font-body" style={{ fontSize: 16, color: "#2A2926", lineHeight: 1.75 }}>We have no agreements with data brokers, aggregators, or data enrichment services. We do not buy data. We do not sell data.</p>

            <h3 className="font-body font-semibold mt-6 mb-3" style={{ fontSize: 16, color: "#2A2926" }}>No AI training with identifiable data</h3>
            <p className="font-body" style={{ fontSize: 16, color: "#2A2926", lineHeight: 1.75 }}>Your child's conversations are not used to train AI models. Yoluno uses pre-trained language models that are configured and filtered for children. Your child's data does not flow back into the model's training.</p>
          </div>

          <Divider />

          {/* Section 3 — Specific Data Types */}
          <SectionHeading id="specific-data-types">Specific Data Types — Detailed Breakdown</SectionHeading>

          <Accordion type="single" collapsible className="mt-4">
            <AccordionItem value="conversation" className="border-b" style={{ borderColor: "#E8E6E1" }}>
              <AccordionTrigger className="font-body font-semibold hover:no-underline py-5" style={{ fontSize: 16, color: "#2A2926" }}>
                Conversation data
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 pb-2">
                  <p className="font-body" style={{ fontSize: 15, color: "#6B675E", lineHeight: 1.7 }}><strong>What it includes:</strong> The exact text exchanged between your child and Yoluno's AI guides. Timestamps. The guide involved. Whether a safety redirect was triggered.</p>
                  <p className="font-body" style={{ fontSize: 15, color: "#6B675E", lineHeight: 1.7 }}><strong>Who sees it:</strong> Your child (during the session). You (in the Parent Dashboard, anytime). Yoluno's safety team (only if you flag a specific response).</p>
                  <p className="font-body" style={{ fontSize: 15, color: "#6B675E", lineHeight: 1.7 }}><strong>How long it's kept:</strong> Until you delete it, or until your account is closed.</p>
                  <p className="font-body" style={{ fontSize: 15, color: "#6B675E", lineHeight: 1.7 }}><strong>Can it be exported?</strong> Yes. From the Parent Dashboard, in standard text format.</p>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="mood" className="border-b" style={{ borderColor: "#E8E6E1" }}>
              <AccordionTrigger className="font-body font-semibold hover:no-underline py-5" style={{ fontSize: 16, color: "#2A2926" }}>
                Mood check-in data
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 pb-2">
                  <p className="font-body" style={{ fontSize: 15, color: "#6B675E", lineHeight: 1.7 }}><strong>What it includes:</strong> The mood your child selected. Timestamp. The follow-up path chosen.</p>
                  <p className="font-body" style={{ fontSize: 15, color: "#6B675E", lineHeight: 1.7 }}><strong>Who sees it:</strong> Your child (during the session). You (in the Parent Dashboard, with historical patterns).</p>
                  <p className="font-body" style={{ fontSize: 15, color: "#6B675E", lineHeight: 1.7 }}><strong>How long it's kept:</strong> Until you delete the child's profile or close your account.</p>
                  <p className="font-body" style={{ fontSize: 15, color: "#6B675E", lineHeight: 1.7 }}><strong>Can it be exported?</strong> Yes.</p>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="story" className="border-b" style={{ borderColor: "#E8E6E1" }}>
              <AccordionTrigger className="font-body font-semibold hover:no-underline py-5" style={{ fontSize: 16, color: "#2A2926" }}>
                Story data
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 pb-2">
                  <p className="font-body" style={{ fontSize: 15, color: "#6B675E", lineHeight: 1.7 }}><strong>What it includes:</strong> Story text co-created by your child and Lumi. Character names. Plot choices. Completion status.</p>
                  <p className="font-body" style={{ fontSize: 15, color: "#6B675E", lineHeight: 1.7 }}><strong>Who sees it:</strong> Your child (in the Stories space). You (in the Parent Dashboard).</p>
                  <p className="font-body" style={{ fontSize: 15, color: "#6B675E", lineHeight: 1.7 }}><strong>How long it's kept:</strong> Until you delete it or close your account.</p>
                  <p className="font-body" style={{ fontSize: 15, color: "#6B675E", lineHeight: 1.7 }}><strong>Can it be exported?</strong> Yes. Printable versions available from the Dashboard.</p>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="journey" className="border-b" style={{ borderColor: "#E8E6E1" }}>
              <AccordionTrigger className="font-body font-semibold hover:no-underline py-5" style={{ fontSize: 16, color: "#2A2926" }}>
                Journey data
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 pb-2">
                  <p className="font-body" style={{ fontSize: 15, color: "#6B675E", lineHeight: 1.7 }}><strong>What it includes:</strong> Which journeys are active. Step progress. Reflection responses. Completion status.</p>
                  <p className="font-body" style={{ fontSize: 15, color: "#6B675E", lineHeight: 1.7 }}><strong>Who sees it:</strong> Your child (in the Journeys space). You (in the Parent Dashboard).</p>
                  <p className="font-body" style={{ fontSize: 15, color: "#6B675E", lineHeight: 1.7 }}><strong>How long it's kept:</strong> Until you delete the child's profile or close your account.</p>
                  <p className="font-body" style={{ fontSize: 15, color: "#6B675E", lineHeight: 1.7 }}><strong>Can it be exported?</strong> Yes.</p>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="family" className="border-b" style={{ borderColor: "#E8E6E1" }}>
              <AccordionTrigger className="font-body font-semibold hover:no-underline py-5" style={{ fontSize: 16, color: "#2A2926" }}>
                Family space data
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 pb-2">
                  <p className="font-body" style={{ fontSize: 15, color: "#6B675E", lineHeight: 1.7 }}><strong>What it includes:</strong> Voice recordings, photos, and written stories uploaded by parents. Metadata (upload date, file type, file size).</p>
                  <p className="font-body" style={{ fontSize: 15, color: "#6B675E", lineHeight: 1.7 }}><strong>Who sees it:</strong> Your child (through the Loti interface). You (through the Parent Dashboard).</p>
                  <p className="font-body" style={{ fontSize: 15, color: "#6B675E", lineHeight: 1.7 }}><strong>Who uploaded it:</strong> Only the parent. Children cannot upload to the Family space.</p>
                  <p className="font-body" style={{ fontSize: 15, color: "#6B675E", lineHeight: 1.7 }}>Profile photos uploaded by parents or children are stored within the family's private account and visible only to family members. They are not used for facial recognition, AI training, or any purpose beyond displaying the child's avatar within Yoluno.</p>
                  <p className="font-body" style={{ fontSize: 15, color: "#6B675E", lineHeight: 1.7 }}><strong>How long it's kept:</strong> Until you delete it or close your account.</p>
                  <p className="font-body" style={{ fontSize: 15, color: "#6B675E", lineHeight: 1.7 }}><strong>Can it be exported?</strong> Yes. All files in original format.</p>
                  <p className="font-body" style={{ fontSize: 15, color: "#6B675E", lineHeight: 1.7 }}><strong>Is it used for AI training?</strong> No. Family space content is never used to train, improve, or evaluate AI models.</p>
                  <p className="font-body" style={{ fontSize: 15, color: "#6B675E", lineHeight: 1.7 }}><strong>Is voice data used for voice synthesis?</strong> No. Yoluno does not clone, synthesise, or reproduce anyone's voice. Voice recordings are played back exactly as uploaded.</p>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="usage" className="border-b" style={{ borderColor: "#E8E6E1" }}>
              <AccordionTrigger className="font-body font-semibold hover:no-underline py-5" style={{ fontSize: 16, color: "#2A2926" }}>
                Usage data
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 pb-2">
                  <p className="font-body" style={{ fontSize: 15, color: "#6B675E", lineHeight: 1.7 }}><strong>What it includes:</strong> Session start and end times. Features accessed. Device type and operating system.</p>
                  <p className="font-body" style={{ fontSize: 15, color: "#6B675E", lineHeight: 1.7 }}><strong>Who sees it:</strong> Yoluno team (in aggregate). You (session length visible in Dashboard).</p>
                  <p className="font-body" style={{ fontSize: 15, color: "#6B675E", lineHeight: 1.7 }}><strong>How long it's kept:</strong> Aggregated data retained for product improvement. Individual session data deleted when the account is closed.</p>
                  <p className="font-body" style={{ fontSize: 15, color: "#6B675E", lineHeight: 1.7 }}><strong>Is it shared?</strong> Never.</p>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <Divider />

          {/* Section 4 — If Yoluno Shuts Down */}
          <SectionHeading id="if-yoluno-shuts-down">If Yoluno Shuts Down</SectionHeading>
          <Body>If Yoluno ever discontinues service:</Body>
          <div className="mt-3 space-y-3">
            <Body>You will receive at least 90 days' notice via email.</Body>
            <Body>During that period, you can export all your data — every conversation, family memory, photo, voice recording, and story — in standard, open formats that work anywhere.</Body>
            <Body>After the notice period, all data is permanently deleted from our servers. Nothing is transferred, sold, archived, or retained.</Body>
            <Body>This commitment is documented in our Terms of Service.</Body>
          </div>

          <Divider />

          {/* Section 5 — Exercise Your Rights */}
          <SectionHeading id="exercise-your-rights">How to Exercise Your Data Rights</SectionHeading>

          {/* Desktop table */}
          <div className="hidden md:block mt-6">
            {dataRights.map((row, i) => (
              <div
                key={i}
                className="grid grid-cols-[200px_1fr] gap-6 py-4 px-5"
                style={{ backgroundColor: i % 2 === 1 ? "#F5F3EE" : "transparent", borderRadius: 8 }}
              >
                <span className="font-body font-semibold" style={{ fontSize: 15, color: "#2A2926" }}>{row.action}</span>
                <span className="font-body" style={{ fontSize: 15, color: "#6B675E", lineHeight: 1.7 }}>{row.how}</span>
              </div>
            ))}
          </div>

          {/* Mobile stacked */}
          <div className="md:hidden mt-6 space-y-4">
            {dataRights.map((row, i) => (
              <div key={i} className="p-4 rounded-lg" style={{ backgroundColor: "#F5F3EE" }}>
                <p className="font-body font-semibold mb-1" style={{ fontSize: 15, color: "#2A2926" }}>{row.action}</p>
                <p className="font-body" style={{ fontSize: 14, color: "#6B675E", lineHeight: 1.7 }}>{row.how}</p>
              </div>
            ))}
          </div>

          <Divider />

          {/* Bottom CTA */}
          <div className="text-center">
            <h2 className="font-heading" style={{ fontSize: 28, color: "#2A2926", marginBottom: 16 }}>Questions?</h2>
            <p className="font-body" style={{ fontSize: 16, color: "#6B675E" }}>
              If anything on this page is unclear, or if you want to know something we haven't covered, email us:{" "}
              <a href="mailto:privacy@yoluno.com" className="text-primary hover:underline">privacy@yoluno.com</a>
            </p>
            <p className="font-body mt-2 italic" style={{ fontSize: 16, color: "#6B675E" }}>
              We believe data practices should be boring in their predictability. You should never be surprised by what we do with your information.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
