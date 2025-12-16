/**
 * Landing Page
 *
 * Public marketing/home page with Yoluno AI branding.
 */

import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { BookOpen, Shield, Users, Brain, Sparkles, Star } from 'lucide-react';

function Logo({ className = '' }: { className?: string }) {
  return (
    <Link to="/" className={`font-logo text-2xl tracking-tight ${className}`}>
      <span className="text-charcoal">Yoluno</span>
      <span className="text-cyan"> AI</span>
    </Link>
  );
}

function Navigation() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="container-yoluno flex items-center justify-between h-16">
        <Logo />
        <nav className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-charcoal-light link-underline text-sm font-medium">
            Features
          </a>
          <a href="#safety" className="text-charcoal-light link-underline text-sm font-medium">
            Safety
          </a>
          <a href="#about" className="text-charcoal-light link-underline text-sm font-medium">
            About
          </a>
        </nav>
        <div className="flex items-center gap-3">
          <Link to="/login">
            <Button variant="ghost" className="text-charcoal-light">Sign In</Button>
          </Link>
          <Link to="/signup">
            <Button>Get Started</Button>
          </Link>
        </div>
      </div>
    </header>
  );
}

function HeroSection() {
  return (
    <section className="pt-32 pb-20 bg-gradient-to-b from-pastel-blue to-white">
      <div className="container-yoluno">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-pastel-pink mb-6">
            <Sparkles className="h-4 w-4 text-cyan" />
            <span className="text-sm font-medium text-charcoal">AI-Powered Learning for Kids</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-charcoal leading-tight mb-6">
            Safe, Fun Learning
            <br />
            <span className="text-cyan">Adventures for Kids</span>
          </h1>
          <p className="text-lg md:text-xl text-charcoal-muted mb-10 max-w-2xl mx-auto">
            Yoluno AI creates personalized stories, interactive learning journeys, and a friendly AI buddy - all designed with child safety as the top priority.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup">
              <Button size="lg" className="w-full sm:w-auto gap-2">
                <Star className="h-5 w-5" />
                Start Free Trial
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  const features = [
    {
      icon: BookOpen,
      title: 'Personalized Stories',
      description: 'AI-generated stories tailored to your child\'s interests, age, and reading level.',
      color: 'bg-pastel-purple',
    },
    {
      icon: Brain,
      title: 'Learning Journeys',
      description: 'Interactive educational paths that adapt to how your child learns best.',
      color: 'bg-pastel-blue',
    },
    {
      icon: Users,
      title: 'AI Buddy Chat',
      description: 'A friendly AI companion that answers questions and encourages curiosity.',
      color: 'bg-pastel-pink',
    },
  ];

  return (
    <section id="features" className="py-20 bg-white">
      <div className="container-yoluno">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-charcoal mb-4">
            Everything Kids Need to Learn & Grow
          </h2>
          <p className="text-charcoal-muted text-lg max-w-2xl mx-auto">
            Engaging features designed by educators and powered by cutting-edge AI technology.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="p-8 rounded-2xl bg-white border border-gray-100 card-hover"
            >
              <div className={`w-14 h-14 rounded-xl ${feature.color} flex items-center justify-center mb-6`}>
                <feature.icon className="h-7 w-7 text-cyan" />
              </div>
              <h3 className="text-xl font-semibold text-charcoal mb-3">{feature.title}</h3>
              <p className="text-charcoal-muted">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SafetySection() {
  return (
    <section id="safety" className="py-20 bg-pastel-pink">
      <div className="container-yoluno">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white mb-6">
              <Shield className="h-4 w-4 text-cyan" />
              <span className="text-sm font-medium text-charcoal">Safety First</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-charcoal mb-6">
              Built with Safety at the Core
            </h2>
            <p className="text-charcoal-muted text-lg mb-8">
              We take child safety seriously. Our three-layer content validation system ensures every interaction is age-appropriate and educational.
            </p>
            <ul className="space-y-4">
              {[
                'Real-time content monitoring',
                'Parent dashboard with full visibility',
                'Age-appropriate content filtering',
                'No data collection from children',
              ].map((item) => (
                <li key={item} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-cyan flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-charcoal">{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="relative">
            <div className="aspect-square rounded-3xl bg-white shadow-xl p-8 flex items-center justify-center">
              <Shield className="h-32 w-32 text-cyan opacity-20" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl font-bold text-cyan mb-2">100%</div>
                  <div className="text-charcoal-muted">Safe Interactions</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="py-20 bg-charcoal">
      <div className="container-yoluno text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
          Ready to Start the Adventure?
        </h2>
        <p className="text-gray-400 text-lg mb-10 max-w-2xl mx-auto">
          Join thousands of families using Yoluno AI to make learning fun and safe for their children.
        </p>
        <Link to="/signup">
          <Button size="lg" className="gap-2">
            <Sparkles className="h-5 w-5" />
            Get Started Free
          </Button>
        </Link>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="py-12 bg-white border-t border-gray-100">
      <div className="container-yoluno">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <Logo />
          <p className="text-charcoal-muted text-sm">
            &copy; {new Date().getFullYear()} Yoluno AI. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-charcoal-muted hover:text-cyan text-sm">
              Privacy
            </a>
            <a href="#" className="text-charcoal-muted hover:text-cyan text-sm">
              Terms
            </a>
            <a href="#" className="text-charcoal-muted hover:text-cyan text-sm">
              Contact
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <HeroSection />
      <FeaturesSection />
      <SafetySection />
      <CTASection />
      <Footer />
    </div>
  );
}
