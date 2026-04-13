import AnimatedSection from "@/components/landing/AnimatedSection";

const trustItems = [
  { icon: "🔒", text: "No open internet" },
  { icon: "🚫", text: "No ads — ever" },
  { icon: "🛡️", text: "Data never sold or shared" },
  { icon: "👁️", text: "Full parent visibility" },
  { icon: "📚", text: "English National Curriculum built in" },
  { icon: "🌍", text: "20+ languages including Arabic, Chinese & French" },
];

export default function TrustStripSection() {
  return (
    <section className="py-6 bg-secondary border-y border-border">
      <div className="container">
        <AnimatedSection>
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10">
            {trustItems.map((item) => (
              <div key={item.text} className="flex items-center gap-2 font-body text-sm font-medium text-foreground">
                <span>{item.icon}</span>
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
