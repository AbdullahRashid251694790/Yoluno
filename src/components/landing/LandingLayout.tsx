import LandingNavbar from "@/components/landing/LandingNavbar";
import LandingFooter from "@/components/landing/LandingFooter";
import BackToTop from "@/components/landing/BackToTop";

interface LandingLayoutProps {
  children: React.ReactNode;
}

export default function LandingLayout({ children }: LandingLayoutProps) {
  return (
    <div className="landing-scope">
      <LandingNavbar />
      {children}
      <LandingFooter />
      <BackToTop />
    </div>
  );
}
