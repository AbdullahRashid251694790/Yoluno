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

export default function Footer() {
  return (
    <footer className="bg-secondary border-t border-border pt-16 pb-10 px-6">
      <div className="container flex flex-col items-center gap-8">
        <img src={logo} alt="Yoluno" className="h-14" />

        <nav className="flex flex-wrap justify-center gap-6">
          {footerLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="text-sm font-body text-muted-foreground hover:text-foreground transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <p className="text-center font-body text-muted-foreground text-sm">
          Where Curiosity, Creativity & Care Come Together 🌱
        </p>

        <p className="text-center font-body text-muted-foreground/70 text-xs">
          © 2026 Yoluno. Made with 💛 for children everywhere.
        </p>
        <div className="flex flex-wrap justify-center gap-3 mt-3">
          <Link to="/privacy-policy" className="font-body text-muted-foreground/70 hover:text-foreground text-xs transition-colors">Privacy Policy</Link>
          <span className="text-border text-xs">·</span>
          <a href="/safety-charter" className="font-body text-muted-foreground/70 hover:text-foreground text-xs transition-colors">Safety Charter</a>
          <span className="text-border text-xs">·</span>
          <Link to="/data-practices" className="font-body text-muted-foreground/70 hover:text-foreground text-xs transition-colors">Data Practices</Link>
          <span className="text-border text-xs">·</span>
          <Link to="/how-ai-works" className="font-body text-muted-foreground/70 hover:text-foreground text-xs transition-colors">How AI Works in Yoluno</Link>
        </div>
      </div>
    </footer>
  );
}
