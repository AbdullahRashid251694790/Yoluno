/**
 * Landing Page
 *
 * Marketing homepage for unauthenticated users.
 * Showcases Yoluno's features and trust factors.
 */

import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Sparkles,
  Shield,
  Heart,
  BookOpen,
  MessageCircle,
  Map,
  Users,
  Lock,
  Ban,
  Eye,
} from 'lucide-react';

// Import assets
import lunoLogo from '@/assets/landing/yoluno-logo.png';
import coppaBadge from '@/assets/coppa-certified-badge.png';
import kidsafeBadge from '@/assets/kidsafe-certified-badge.png';
import encryptedBadge from '@/assets/encrypted-secure-badge.png';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-lumi/5 via-white to-lolo/10">
      {/* Navigation */}
      <nav className="container mx-auto px-4 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src={lunoLogo} alt="Yoluno" className="h-10" />
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login">
            <Button variant="ghost">Sign In</Button>
          </Link>
          <Link to="/signup">
            <Button>Get Started</Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left - Content */}
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
              <Shield className="h-4 w-4" />
              Safe AI for Kids
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-foreground leading-tight">
              The safe AI companion for{' '}
              <span className="text-primary">your children</span>
            </h1>

            <p className="text-lg text-muted-foreground max-w-lg">
              Yoluno brings the magic of AI to children ages 2-10 with complete
              parental control. Interactive stories, learning journeys, and a
              caring AI friend - all in a safe, ad-free environment.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link to="/signup">
                <Button size="lg" className="text-lg px-8">
                  <Sparkles className="mr-2 h-5 w-5" />
                  Start Free Trial
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline" className="text-lg px-8">
                  Sign In
                </Button>
              </Link>
            </div>

            {/* Trust indicators */}
            <div className="flex items-center gap-6 pt-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Lock className="h-4 w-4 text-primary" />
                <span>COPPA Compliant</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Ban className="h-4 w-4 text-primary" />
                <span>No Ads</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Eye className="h-4 w-4 text-primary" />
                <span>Parent Controlled</span>
              </div>
            </div>
          </div>

          {/* Right - Luno Character */}
          <div className="relative flex justify-center">
            <div className="relative">
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-primary/30 to-child-secondary/30 rounded-full blur-3xl" />

              {/* Luno image */}
              <img
                src="/avatars/Luno.png"
                alt="Luno - Your AI Companion"
                className="relative z-10 w-64 md:w-80 lg:w-96 drop-shadow-2xl animate-float"
              />

              {/* Speech bubble */}
              <div className="absolute -right-4 top-8 bg-white rounded-2xl rounded-br-none px-4 py-3 shadow-lg animate-bounce-gentle">
                <p className="text-sm font-medium text-foreground">
                  Hi! I'm Luno! 👋
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Value Propositions */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
            Built for families, loved by kids
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Everything your child needs to learn, explore, and grow - with
            everything you need to keep them safe.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* For Children */}
          <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CardContent className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <Heart className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-2xl font-display font-bold text-foreground">
                  For Children
                </h3>
              </div>

              <ul className="space-y-4">
                <FeatureItem
                  icon={MessageCircle}
                  title="AI Companion"
                  description="Luno is a friendly AI buddy who listens, teaches, and plays"
                />
                <FeatureItem
                  icon={BookOpen}
                  title="Personalized Stories"
                  description="Your child becomes the hero of their own adventures"
                />
                <FeatureItem
                  icon={Map}
                  title="Learning Journeys"
                  description="Fun goals and habits that build real-world skills"
                />
                <FeatureItem
                  icon={Users}
                  title="Family Connection"
                  description="Connect to family heritage and loved ones"
                />
              </ul>
            </CardContent>
          </Card>

          {/* For Parents */}
          <Card className="border-2 border-child-secondary/20 bg-gradient-to-br from-child-secondary/5 to-transparent">
            <CardContent className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-12 w-12 rounded-full bg-child-secondary/20 flex items-center justify-center">
                  <Shield className="h-6 w-6 text-child-secondary" />
                </div>
                <h3 className="text-2xl font-display font-bold text-foreground">
                  For Parents
                </h3>
              </div>

              <ul className="space-y-4">
                <FeatureItem
                  icon={Eye}
                  title="Complete Visibility"
                  description="See and approve all content before your child sees it"
                  color="child-secondary"
                />
                <FeatureItem
                  icon={Lock}
                  title="Full Control"
                  description="PIN-protected dashboard with safety monitoring"
                  color="child-secondary"
                />
                <FeatureItem
                  icon={Heart}
                  title="Mood Insights"
                  description="Track your child's emotional wellbeing over time"
                  color="child-secondary"
                />
                <FeatureItem
                  icon={Shield}
                  title="Closed Sandbox"
                  description="No open internet access - only curated, safe content"
                  color="child-secondary"
                />
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Trust Badges Section */}
      <section className="bg-white py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
              Trust & Safety First
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              We take children's privacy and safety seriously. Yoluno is
              designed from the ground up with protection in mind.
            </p>
          </div>

          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16">
            <div className="flex flex-col items-center text-center">
              <img
                src={coppaBadge}
                alt="COPPA Certified"
                className="h-20 md:h-24 mb-3"
              />
              <p className="text-sm font-medium text-foreground">COPPA Compliant</p>
              <p className="text-xs text-muted-foreground">Children's Privacy</p>
            </div>

            <div className="flex flex-col items-center text-center">
              <img
                src={kidsafeBadge}
                alt="kidSAFE Certified"
                className="h-20 md:h-24 mb-3"
              />
              <p className="text-sm font-medium text-foreground">kidSAFE Certified</p>
              <p className="text-xs text-muted-foreground">Safety Standard</p>
            </div>

            <div className="flex flex-col items-center text-center">
              <img
                src={encryptedBadge}
                alt="Encrypted & Secure"
                className="h-20 md:h-24 mb-3"
              />
              <p className="text-sm font-medium text-foreground">Encrypted</p>
              <p className="text-xs text-muted-foreground">Data Protection</p>
            </div>
          </div>

          <div className="mt-12 text-center">
            <p className="text-muted-foreground mb-4">
              No ads. No data monetization. Just safe, educational fun.
            </p>
            <Link to="/signup">
              <Button size="lg">
                <Sparkles className="mr-2 h-5 w-5" />
                Get Started for Free
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="bg-gradient-to-r from-primary to-child-secondary rounded-3xl p-8 md:p-12 text-center text-white">
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
            Ready to meet Luno?
          </h2>
          <p className="text-lg opacity-90 mb-8 max-w-lg mx-auto">
            Start your free 7-day trial today. No credit card required.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/signup">
              <Button size="lg" variant="secondary" className="text-lg px-8">
                Create Account
              </Button>
            </Link>
            <Link to="/login">
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 bg-transparent border-white text-white hover:bg-white/20"
              >
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted/30 py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <img src={lunoLogo} alt="Yoluno" className="h-8" />
              <span className="text-sm text-muted-foreground">
                © {new Date().getFullYear()} Yoluno. All rights reserved.
              </span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground">
                Privacy Policy
              </a>
              <a href="#" className="hover:text-foreground">
                Terms of Service
              </a>
              <a href="#" className="hover:text-foreground">
                Contact
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Feature item component
function FeatureItem({
  icon: Icon,
  title,
  description,
  color = 'primary',
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  color?: 'primary' | 'child-secondary';
}) {
  return (
    <li className="flex items-start gap-3">
      <div
        className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
          color === 'primary' ? 'bg-primary/10' : 'bg-child-secondary/10'
        }`}
      >
        <Icon
          className={`h-4 w-4 ${
            color === 'primary' ? 'text-primary' : 'text-child-secondary'
          }`}
        />
      </div>
      <div>
        <h4 className="font-semibold text-foreground">{title}</h4>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </li>
  );
}
