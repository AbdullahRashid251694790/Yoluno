import FloatingBlocks from "@/components/landing/FloatingBlocks";
import LandingNavbar from "@/components/landing/LandingNavbar";
import LandingFooter from "@/components/landing/LandingFooter";
import BackToTop from "@/components/landing/BackToTop";
import "./landing-layout.css";

interface LandingLayoutProps {
  children: React.ReactNode;
}

export default function LandingLayout({ children }: LandingLayoutProps) {
  return (
    <div
      className="landing-layout min-h-screen font-body text-foreground"
      style={{
        background: `
          repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(61, 214, 200, 0.018) 3px, rgba(61, 214, 200, 0.018) 4px),
          repeating-linear-gradient(90deg, transparent, transparent 3px, rgba(61, 214, 200, 0.018) 3px, rgba(61, 214, 200, 0.018) 4px),
          linear-gradient(170deg, hsl(174 55% 80%) 0%, hsl(200 50% 84%) 15%, hsl(260 40% 85%) 30%, hsl(300 30% 86%) 45%, hsl(340 35% 87%) 55%, hsl(30 50% 85%) 70%, hsl(45 55% 88%) 85%, hsl(42 60% 96%) 100%)
        `,
        backgroundAttachment: 'fixed',
      }}
    >
      <FloatingBlocks />
      <LandingNavbar />
      {children}
      <LandingFooter />
      <BackToTop />
    </div>
  );
}
