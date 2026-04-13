import { Link } from "react-router-dom";
import AnimatedSection from "@/components/landing/AnimatedSection";

interface PageCTAProps {
  heading: string;
  subtitle: string;
}

export default function PageCTA({ heading, subtitle }: PageCTAProps) {
  return (
    <section className="py-[100px]" style={{ backgroundColor: "#FAFAF7" }}>
      <div className="container max-w-[640px] text-center">
        <AnimatedSection>
          <h2 className="font-heading text-[28px] md:text-[36px] text-foreground mb-5">
            {heading}
          </h2>
          <p className="font-body text-[17px] text-muted-foreground leading-[1.7] mb-10">
            {subtitle}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-5">
            <Link
              to="/signup"
              className="font-body font-semibold text-[16px] text-white px-10 py-[18px] rounded-[10px] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg inline-block"
              style={{ backgroundColor: "#3ECDC6" }}
            >
              Start Free Trial — Parent Sign-Up Required
            </Link>
            <Link
              to="/features"
              className="font-body text-[15px] px-7 py-[15px] rounded-[10px] transition-all duration-200 hover:-translate-y-0.5"
              style={{ color: "#6B675E", border: "1.5px solid #E8E6E1" }}
            >
              Explore the World →
            </Link>
          </div>
          <p className="font-body text-[13px]" style={{ color: "#9B978E" }}>
            No credit card needed · Adult verification at sign-up · Full access for 14 days
          </p>
        </AnimatedSection>
      </div>
    </section>
  );
}
