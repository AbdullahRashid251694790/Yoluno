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
    <footer className="bg-navy pt-16 pb-10 px-6">
      <div className="container flex flex-col items-center gap-8">
        <img src={logo} alt="Yoluno" className="h-10 brightness-0 invert" />

        <nav className="flex flex-wrap justify-center gap-6">
          {footerLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="text-sm font-body text-white/60 hover:text-white transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <p className="text-center font-body text-white/40 text-sm">
          Where Curiosity, Creativity & Care Come Together
        </p>

        <p className="text-center font-body text-white/30 text-xs">
          &copy; {new Date().getFullYear()} Yoluno. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
