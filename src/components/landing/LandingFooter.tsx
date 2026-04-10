import { Link } from "react-router-dom";
import logo from "@/assets/landing/yoluno-logo.png";

const footerLinks = [
  { label: "Features", to: "/features" },
  { label: "For Parents", to: "/for-parents" },
  { label: "Pricing", to: "/pricing" },
  { label: "About", to: "/about" },
  { label: "Blog", to: "/blog" },
  { label: "FAQs", to: "/faqs" },
];

export default function LandingFooter() {
  return (
    <footer
      className="relative z-[1] border-t border-white/30 pt-12 pb-8 px-6"
      style={{
        background: 'linear-gradient(180deg, hsl(42 60% 93% / 0.85) 0%, hsl(30 50% 88% / 0.85) 50%, hsl(200 40% 85% / 0.85) 100%)',
      }}
    >
      <div className="container flex flex-col items-center gap-6">
        <img src={logo} alt="Yoluno" className="h-10" />

        <nav className="flex flex-wrap justify-center gap-6">
          {footerLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="text-sm font-body text-foreground/60 hover:text-foreground transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <p className="text-center font-body text-foreground/40 text-sm italic">
          Where Curiosity, Creativity & Care Come Together
        </p>

        <p className="text-center font-body text-foreground/30 text-xs">
          &copy; {new Date().getFullYear()} Yoluno. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
