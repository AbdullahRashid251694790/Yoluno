import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import AnimatedSection from "@/components/landing/AnimatedSection";
import curiosityBlocksImg from "@/assets/landing/curiosity-blocks.png";

export default function WhyYolunoSection() {
  return (
    <section className="section-padding bg-background">
      <div className="container">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <AnimatedSection>
            <p className="text-label mb-4">The Promise</p>
            <h2 className="font-heading text-3xl md:text-[38px] text-foreground mb-6 leading-tight">
              A Place Made for Curiosity
            </h2>
            <div className="space-y-5 font-body text-[17px] text-muted-foreground leading-[1.7]">
              <p>
                Yoluno is a world designed to move at your child's pace.
              </p>
              <p>
                No ads, no pressure, no engagement tricks. Just a place where curiosity gets to lead the way — and you stay in control.
              </p>
            </div>
            <div className="mt-8">
              <Button variant="outline" size="lg" asChild>
                <Link to="/about">Learn More About Yoluno →</Link>
              </Button>
            </div>
          </AnimatedSection>

          <AnimatedSection delay={0.2} className="flex justify-center">
            <div className="rounded-2xl overflow-hidden shadow-warm border border-border">
              <img
                src={curiosityBlocksImg}
                alt="Child building with colorful blocks and a friendly robot toy"
                className="w-full h-auto"
                loading="lazy"
              />
            </div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  );
}
