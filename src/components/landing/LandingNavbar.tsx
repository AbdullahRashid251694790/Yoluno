import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/landing/yoluno-logo-original.png";

const navLinks = [
  { label: "Features", to: "/features" },
  { label: "For Parents", to: "/for-parents" },
  { label: "Pricing", to: "/pricing" },
  { label: "About", to: "/about" },
  { label: "Blog", to: "/blog" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(false);
  const location = useLocation();

  // Scroll direction detector: hide on scroll down, reveal on any scroll up.
  // Stays visible near the top and whenever the mobile menu is open.
  useEffect(() => {
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 40);

      if (y < 80 || open) {
        setHidden(false);
      } else if (y > lastY + 4) {
        setHidden(true);
      } else if (y < lastY - 4) {
        setHidden(false);
      }
      lastY = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [open]);

  useEffect(() => setOpen(false), [location]);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          hidden ? "-translate-y-full" : "translate-y-0"
        } ${
          scrolled || open ? "bg-card/95 backdrop-blur-md shadow-warm" : "bg-transparent"
        }`}
      >
        <div className="container flex items-center justify-between h-16 lg:h-20">
          <Link to="/" className="flex-shrink-0">
            <img src={logo} alt="Yoluno" className="h-8 lg:h-10" />
          </Link>

          {/* Desktop Nav — only shown at lg+ so iPad portrait keeps the hamburger */}
          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`relative text-[15px] font-medium font-body transition-colors hover:text-primary ${
                  location.pathname === link.to ? "text-primary" : "text-foreground"
                }`}
              >
                {link.label}
                {location.pathname === link.to && (
                  <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-primary" />
                )}
              </Link>
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-3">
            <Button variant="outline" size="sm" asChild className="rounded-full border-[#E8B630] text-[#E8B630] hover:bg-[#E8B630]/10 font-body font-semibold">
              <Link to="/play">Kids Mode</Link>
            </Button>
            <Button size="sm" asChild><Link to="/dashboard">Parent Dashboard</Link></Button>
          </div>

          {/* Hamburger toggle — visible on phones AND tablet portrait */}
          <button
            onClick={() => setOpen(!open)}
            className="lg:hidden p-2 text-foreground"
            aria-label="Toggle menu"
          >
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {/* Mobile/tablet overlay — rendered OUTSIDE the header so the header's
          transform animation doesn't constrain its fixed positioning. */}
      {open && (
        <div className="lg:hidden fixed inset-0 top-16 bg-background z-40 flex flex-col items-center pt-12 gap-6 overflow-y-auto">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="text-lg font-medium font-body text-foreground hover:text-primary transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <Button variant="outline" className="rounded-full border-[#E8B630] text-[#E8B630] hover:bg-[#E8B630]/10 font-body font-semibold" asChild><Link to="/play">Kids Mode</Link></Button>
          <Button className="mt-2" asChild><Link to="/dashboard">Parent Dashboard</Link></Button>
        </div>
      )}
    </>
  );
}
