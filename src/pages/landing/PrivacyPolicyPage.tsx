import { useState, useEffect } from "react";
import { useIsMobile } from "@/hooks/useIsMobile";
import { ChevronDown } from "lucide-react";

const sections = [
  { id: "introduction", label: "Introduction" },
  { id: "who-we-are", label: "Who We Are" },
  { id: "what-we-collect", label: "What We Collect" },
  { id: "how-we-use-information", label: "How We Use Information" },
  { id: "childrens-privacy", label: "Children's Privacy" },
  { id: "data-sharing", label: "Data Sharing" },
  { id: "data-storage-security", label: "Storage & Security" },
  { id: "data-retention", label: "Data Retention" },
  { id: "your-rights", label: "Your Rights" },
  { id: "cookies-and-tracking", label: "Cookies & Tracking" },
  { id: "changes", label: "Changes" },
  { id: "contact", label: "Contact Us" },
];

export default function PrivacyPolicyPage() {
  const isMobile = useIsMobile();
  const [activeSection, setActiveSection] = useState(sections[0].id);
  const [tocOpen, setTocOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      for (let i = sections.length - 1; i >= 0; i--) {
        const el = document.getElementById(sections[i].id);
        if (el && el.getBoundingClientRect().top <= 120) {
          setActiveSection(sections[i].id);
          break;
        }
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setTocOpen(false);
  };

  const Divider = () => <hr className="border-t my-12" style={{ borderColor: "#E8E6E1" }} />;
  const SH = ({ id, children }: { id: string; children: React.ReactNode }) => (
    <h2 id={id} className="font-heading scroll-mt-24" style={{ fontSize: 28, color: "#2A2926", marginBottom: 20 }}>{children}</h2>
  );
  const Sub = ({ children }: { children: React.ReactNode }) => (
    <h3 className="font-body font-semibold" style={{ fontSize: 16, color: "#2A2926", marginTop: 28, marginBottom: 12 }}>{children}</h3>
  );
  const P = ({ children }: { children: React.ReactNode }) => (
    <p className="font-body" style={{ fontSize: 16, color: "#2A2926", lineHeight: 1.75 }}>{children}</p>
  );
  const BL = ({ items }: { items: string[] }) => (
    <ul className="font-body space-y-2 pl-5" style={{ fontSize: 15, color: "#6B675E", lineHeight: 1.7, listStyleType: "disc" }}>
      {items.map((t, i) => <li key={i} className="marker:text-[#9B978E]">{t}</li>)}
    </ul>
  );
  const CoralBlock = ({ children }: { children: React.ReactNode }) => (
    <div className="mt-4 rounded-none" style={{ backgroundColor: "#F5F3EE", borderLeft: "3px solid #E8946A", padding: 24 }}>{children}</div>
  );

  return (
    <main className="pt-20" style={{ backgroundColor: "#FAFAF7" }}>
      <div className="relative max-w-[1200px] mx-auto px-6 md:px-12">
        {!isMobile && (
          <nav className="hidden lg:block fixed top-28 w-48" style={{ left: "max(1rem, calc((100vw - 1200px) / 2))" }}>
            <ul className="space-y-2">
              {sections.map((s) => (
                <li key={s.id}>
                  <button onClick={() => scrollTo(s.id)} className="text-left font-body transition-colors w-full" style={{ fontSize: 13, color: activeSection === s.id ? "#3ECDC6" : "#9B978E", fontWeight: activeSection === s.id ? 600 : 400 }}>{s.label}</button>
                </li>
              ))}
            </ul>
          </nav>
        )}

        <div className="max-w-[800px] mx-auto" style={{ paddingTop: 80, paddingBottom: 100 }}>
          <p className="font-body font-semibold uppercase mb-4" style={{ fontSize: 12.5, letterSpacing: 2.5, color: "#3ECDC6" }}>PRIVACY POLICY</p>
          <h1 className="font-heading mb-6" style={{ fontSize: 44, color: "#2A2926" }}>Privacy Policy</h1>
          <p className="font-body mb-6" style={{ fontSize: 17, color: "#6B675E", lineHeight: 1.7 }}>This policy explains how Yoluno collects, uses, stores, and protects personal information. We've written it in plain language because we believe privacy should be understandable, not buried in legal text.</p>
          <p className="font-body" style={{ fontSize: 13, color: "#9B978E" }}>Last updated: April 2026</p>

          {isMobile && (
            <div className="mt-8 mb-4">
              <button onClick={() => setTocOpen(!tocOpen)} className="flex items-center justify-between w-full font-body font-semibold py-3 px-4 rounded-lg border" style={{ fontSize: 14, color: "#2A2926", borderColor: "#E8E6E1", backgroundColor: "#F5F3EE" }}>
                Table of Contents
                <ChevronDown className={`h-4 w-4 transition-transform ${tocOpen ? "rotate-180" : ""}`} style={{ color: "#9B978E" }} />
              </button>
              {tocOpen && (
                <ul className="mt-2 space-y-1 px-4 pb-2" style={{ backgroundColor: "#F5F3EE", borderRadius: 8 }}>
                  {sections.map((s) => (
                    <li key={s.id}><button onClick={() => scrollTo(s.id)} className="font-body py-1.5 w-full text-left" style={{ fontSize: 13, color: activeSection === s.id ? "#3ECDC6" : "#9B978E" }}>{s.label}</button></li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <Divider />

          {/* 1 */}
          <SH id="introduction">Introduction</SH>
          <P>This privacy policy explains how Yoluno collects, uses, stores, and protects personal information. It covers both parent accounts and child profiles.</P>
          <div className="mt-3"><P>If anything is unclear, email us: <a href="mailto:privacy@yoluno.com" className="text-primary hover:underline">privacy@yoluno.com</a></P></div>

          <Divider />

          {/* 2 */}
          <SH id="who-we-are">Who We Are</SH>
          <P>Yoluno is operated by [Your Legal Entity Name], registered in [jurisdiction].</P>
          <div className="mt-3"><P>For data protection purposes, we are the data controller — meaning we decide how personal information is used and are responsible for protecting it.</P></div>
          <div className="mt-3"><P>Data Protection Contact: <a href="mailto:privacy@yoluno.com" className="text-primary hover:underline">privacy@yoluno.com</a></P></div>

          <Divider />

          {/* 3 */}
          <SH id="what-we-collect">What We Collect</SH>
          <Sub>Information you provide directly</Sub>
          <Sub>Parent account information:</Sub>
          <BL items={["Email address", "Password (encrypted, never stored in plain text)", "Payment information (processed by our payment provider — we do not store credit card numbers)"]} />
          <Sub>Child profile information (provided by the parent or child):</Sub>
          <BL items={["Child's first name and surname", "Child's age", "Profile photo (can be uploaded by the parent or the child as their avatar)", "Parent-configured settings (topic preferences, personality traits, feature access)"]} />
          <Sub>Family space content (uploaded by parents only):</Sub>
          <BL items={["Voice recordings", "Photos", "Written family stories or messages"]} />
          <Sub>Information generated through use</Sub>
          <Sub>Conversation data:</Sub>
          <BL items={["Text exchanges between children and Yoluno's AI guides (Luno, Lumi, Lolo, Loti)", "Mood check-in responses", "Story content co-created by children", "Journey progress and reflections"]} />
          <Sub>Usage data:</Sub>
          <BL items={["Session start and end times", "Features accessed", "Device type and operating system (for compatibility purposes)"]} />
          <CoralBlock>
            <h3 className="font-body font-semibold mb-3" style={{ fontSize: 16, color: "#2A2926" }}>Information we do NOT collect</h3>
            <BL items={["Home address, school name, or location data", "Biometric data (fingerprints, facial recognition, voice prints)", "Contact lists, browsing history, or data from other apps", "Any data from other apps on your child's device", "Advertising identifiers"]} />
          </CoralBlock>

          <Divider />

          {/* 4 */}
          <SH id="how-we-use-information">How We Use Information</SH>
          <Sub>To provide the Yoluno experience</Sub>
          <BL items={["Generating AI responses adapted to each child's age and parent-configured settings", "Storing conversation logs so parents can review them in the Dashboard", "Saving stories, journeys, and family content for ongoing access", "Delivering mood check-in features and activity summaries", "Sending weekly summary emails to parents"]} />
          <Sub>To improve safety and quality</Sub>
          <BL items={["Analysing aggregated, anonymised usage patterns to improve safety filters", "Reviewing flagged content to identify and fix issues", "Monitoring system performance and reliability"]} />
          <Sub>To communicate with parents</Sub>
          <BL items={["Account-related emails (sign-up, password reset, billing)", "Weekly activity summaries (can be turned off in Settings)", "Safety notifications when a boundary is triggered", "Service updates and policy changes"]} />
          <CoralBlock>
            <h3 className="font-body font-semibold mb-3" style={{ fontSize: 16, color: "#2A2926" }}>We NEVER use information to:</h3>
            <BL items={["Serve advertisements of any kind", "Create advertising profiles of children or parents", "Sell or share personal data with third parties for marketing", "Target content based on commercial interests", "Train external AI models using identifiable children's data", "Contact children directly"]} />
          </CoralBlock>

          <Divider />

          {/* 5 */}
          <SH id="childrens-privacy">Children's Privacy</SH>
          <P>Yoluno is designed for children aged 3 to 14 and we take children's privacy with the highest seriousness.</P>
          <Sub>Parental consent</Sub>
          <P>Only a parent can create an account and add child profiles. Child profiles cannot be created by children themselves.</P>
          <Sub>Minimal data collection</Sub>
          <P>We collect only the data necessary to provide the Yoluno experience. We do not collect surnames, addresses, school names, or any identifying information beyond a first name and age.</P>
          <Sub>No behavioural tracking</Sub>
          <P>We do not use cookies, pixels, or tracking technologies to profile children's behaviour across sessions or platforms.</P>
          <Sub>No third-party data sharing</Sub>
          <P>Children's personal data is never shared with third parties for any purpose.</P>
          <Sub>Parental access and control</Sub>
          <P>Parents can view, export, or delete all data associated with their child's profile at any time from the Parent Dashboard.</P>
          <Sub>Compliance</Sub>
          <P>We design our privacy practices to comply with the UK Age Appropriate Design Code, the EU General Data Protection Regulation (GDPR), the US Children's Online Privacy Protection Act (COPPA), and the UAE Federal Decree-Law No. 45 of 2021 on Personal Data Protection.</P>

          <Divider />

          {/* 6 */}
          <SH id="data-sharing">Data Sharing</SH>
          <Sub>We share data with:</Sub>
          <P>Service providers who help us operate Yoluno, including:</P>
          <div className="mt-2"><BL items={["Cloud hosting provider — for data storage and processing", "Payment processor — for subscription billing (parent payment data only)", "Email service provider — for sending account and summary emails to parents"]} /></div>
          <div className="mt-3"><P>These providers are bound by data processing agreements and cannot use your data for their own purposes.</P></div>
          <Sub>We do NOT share data with:</Sub>
          <BL items={["Advertisers or marketing platforms", "Data brokers", "Social media companies", "Analytics companies that profile individual users", "Schools or educators (unless you explicitly consent through a separate school licensing agreement)"]} />
          <Sub>Legal requirements</Sub>
          <P>We may disclose personal information if required by law, regulation, or valid legal process. If this happens, we will notify the affected parent unless legally prohibited from doing so.</P>

          <Divider />

          {/* 7 */}
          <SH id="data-storage-security">Data Storage and Security</SH>
          <P>All data is encrypted in transit (TLS 1.2+) and at rest (AES-256).</P>
          <div className="mt-3"><P>Access to personal data is restricted to authorised Yoluno team members who need it to provide support or maintain the service. All access is logged and audited.</P></div>
          <div className="mt-3"><P>We conduct regular security assessments and address vulnerabilities promptly. If you discover a security issue, please report it to <a href="mailto:security@yoluno.com" className="text-primary hover:underline">security@yoluno.com</a>.</P></div>
          <Sub>Breach notification</Sub>
          <P>In the event of a data breach that affects your personal information, we will notify you within 72 hours of becoming aware of it, in accordance with applicable data protection laws.</P>

          <Divider />

          {/* 8 */}
          <SH id="data-retention">Data Retention</SH>
          <Sub>Active accounts</Sub>
          <P>Data is retained for the duration of your subscription to provide the Yoluno experience.</P>
          <Sub>Conversation data</Sub>
          <P>Stored until you delete it or close your account. You can also set conversations to auto-delete after 30, 60, or 90 days in your Dashboard settings.</P>
          <Sub>Family space content</Sub>
          <P>Stored until you delete it or close your account. Deletion is immediate and permanent.</P>
          <Sub>Account deletion</Sub>
          <P>When you delete your account, all associated data — including child profiles, conversations, stories, journeys, family content, and usage data — is permanently removed from our servers within 30 days. We do not retain copies.</P>

          <Divider />

          {/* 9 */}
          <SH id="your-rights">Your Rights</SH>
          <P>Depending on your location, you may have the following rights:</P>
          <Sub>Access</Sub>
          <P>You can request a copy of all personal data we hold about you and your child. You can also view and export this data directly from the Parent Dashboard at any time.</P>
          <Sub>Correction</Sub>
          <P>You can update your account information and your child's profile information at any time from the Dashboard.</P>
          <Sub>Deletion</Sub>
          <P>You can delete individual items (conversations, family content) or your entire account at any time. Account deletion is permanent and completed within 30 days.</P>
          <Sub>Data portability</Sub>
          <P>You can export all your data in standard, machine-readable formats from the Parent Dashboard.</P>
          <Sub>Withdrawal of consent</Sub>
          <P>Where processing is based on consent, you can withdraw that consent at any time.</P>
          <div className="mt-3"><P>To exercise any of these rights, email <a href="mailto:privacy@yoluno.com" className="text-primary hover:underline">privacy@yoluno.com</a> or use the relevant controls in your Parent Dashboard. We will respond within 30 days.</P></div>

          <Divider />

          {/* 10 */}
          <SH id="cookies-and-tracking">Cookies and Tracking</SH>
          <P>Yoluno uses only essential cookies required for the service to function (session management, authentication). We do not use advertising cookies, analytics cookies that track individual users, third-party tracking pixels, social media cookies, or any technology that profiles children's behaviour.</P>

          <Divider />

          {/* 11 */}
          <SH id="changes">Changes to This Policy</SH>
          <P>We may update this policy when our practices change or when regulations evolve. When we do, we will:</P>
          <div className="mt-2"><BL items={["Update the 'Last updated' date at the top", "Summarise what changed and why", "Notify all registered parents by email if the changes are significant", "Never reduce privacy protections without advance notice"]} /></div>

          <Divider />

          {/* 12 */}
          <SH id="contact">Contact Us</SH>
          <div className="grid md:grid-cols-3 gap-4 mt-6">
            {[
              { title: "Privacy Questions", email: "privacy@yoluno.com", desc: "Data access, deletion, and policy questions" },
              { title: "Safety Concerns", email: "safety@yoluno.com", desc: "Report a safety issue" },
              { title: "General", email: "hello@yoluno.com", desc: "Everything else" },
            ].map((c, i) => (
              <div key={i} className="bg-white rounded-xl p-6" style={{ border: "1px solid #E8E6E1" }}>
                <h4 className="font-body font-semibold mb-2" style={{ fontSize: 16, color: "#2A2926" }}>{c.title}</h4>
                <a href={`mailto:${c.email}`} className="text-primary hover:underline font-body text-sm block mb-2">{c.email}</a>
                <p className="font-body" style={{ fontSize: 14, color: "#6B675E" }}>{c.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-8">
            <P>If you are not satisfied with our response to a privacy concern, you have the right to lodge a complaint with your local data protection authority: UK — Information Commissioner's Office (ico.org.uk), EU — your national data protection authority, UAE — UAE Data Office.</P>
          </div>
        </div>
      </div>
    </main>
  );
}
