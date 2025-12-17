/**
 * Landing Page
 *
 * Public marketing/home page with Yoluno AI branding - matching reference design.
 */

import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { BookOpen, Shield, Users, Brain, Star, Heart, Sparkles, Check, MessageCircle, Award, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import yolunoLogo from '@/assets/yoluno-logo.svg';
import heroImage from '@/assets/Header.jpg';
import familyImage from '@/assets/family-storytime.jpg';
import trustImage from '@/assets/trust-care.jpg';
import coppaImage from '@/assets/coppa-certified-badge.png';
import kidsafeImage from '@/assets/kidsafe-certified-badge.png';

function Navigation() {
  const { user, isAuthenticated, isLoading } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-pastel-blue/50 backdrop-blur-md">
      <div className="mx-auto max-w-7xl flex items-center justify-between px-6 h-16">
        <Link to="/" className="flex items-center">
          <img src={yolunoLogo} alt="Yoluno" className="h-10" />
        </Link>
        <nav className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-charcoal hover:text-cyan transition-colors font-medium">
            Features
          </a>
          <a href="#safety" className="text-charcoal hover:text-cyan transition-colors font-medium">
            Safety
          </a>
          <a href="#about" className="text-charcoal hover:text-cyan transition-colors font-medium">
            About
          </a>
        </nav>
        <div className="flex items-center gap-3">
          {isLoading ? null : isAuthenticated ? (
            <>
              <span className="text-charcoal text-sm flex items-center gap-2">
                <User className="h-4 w-4" />
                {user?.email}
              </span>
              <Link to="/dashboard">
                <Button className="bg-cyan hover:bg-cyan-600 text-white rounded-full px-6">
                  Dashboard
                </Button>
              </Link>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" className="text-charcoal hover:text-cyan">Sign In</Button>
              </Link>
              <Link to="/signup">
                <Button className="bg-cyan hover:bg-cyan-600 text-white rounded-full px-6">
                  Start Free
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function HeroSection() {
  return (
    <section className="relative pt-24 pb-20 overflow-hidden bg-gradient-to-b from-blue-50 via-purple-50 to-pink-50">
      {/* Animated floating dots */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-[10%] w-4 h-4 rounded-full bg-pink-300 animate-float opacity-60" style={{ animationDelay: '0s' }} />
        <div className="absolute top-40 left-[20%] w-3 h-3 rounded-full bg-blue-300 animate-float opacity-60" style={{ animationDelay: '0.5s' }} />
        <div className="absolute top-32 right-[15%] w-5 h-5 rounded-full bg-yellow-300 animate-float opacity-60" style={{ animationDelay: '1s' }} />
        <div className="absolute top-60 right-[25%] w-3 h-3 rounded-full bg-purple-300 animate-float opacity-60" style={{ animationDelay: '1.5s' }} />
        <div className="absolute bottom-40 left-[30%] w-4 h-4 rounded-full bg-cyan animate-float opacity-40" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-20 right-[20%] w-3 h-3 rounded-full bg-pink-400 animate-float opacity-50" style={{ animationDelay: '0.3s' }} />
      </div>

      <div className="mx-auto max-w-7xl px-6">
        <div className="grid lg:grid-cols-3 gap-8 items-center">
          {/* Left image */}
          <div className="hidden lg:flex flex-col gap-6 items-end">
            <div className="relative">
              <div className="absolute inset-0 bg-cyan/20 rounded-[40%_60%_60%_40%/60%_40%_60%_40%] transform rotate-6"></div>
              <img
                src={heroImage}
                alt="Happy kids learning"
                className="relative w-64 h-64 object-cover rounded-[40%_60%_60%_40%/60%_40%_60%_40%] shadow-lg"
              />
            </div>
          </div>

          {/* Center content */}
          <div className="text-center lg:col-span-1">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-charcoal leading-tight mb-6 font-heading">
              Safe AI for{' '}
              <span className="text-cyan">Growing Minds</span>
            </h1>
            <p className="text-lg md:text-xl text-charcoal-muted mb-8 max-w-xl mx-auto">
              Spark imagination, build confidence, and learn through play with an AI companion that's warm, wise, and always parent-approved.
            </p>
            <Link to="/signup">
              <Button size="lg" className="bg-cyan hover:bg-cyan-600 text-white rounded-full px-8 py-6 text-lg shadow-lg hover:shadow-xl transition-all">
                <Sparkles className="mr-2 h-5 w-5" />
                Start Free Trial
              </Button>
            </Link>

            {/* Trust badges */}
            <div className="flex flex-wrap justify-center gap-4 mt-10">
              {['No ads, ever', 'Parent-controlled', 'COPPA certified', 'Cancel anytime'].map((badge) => (
                <span
                  key={badge}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 text-sm font-medium text-charcoal shadow-sm"
                >
                  <Check className="h-4 w-4 text-cyan" />
                  {badge}
                </span>
              ))}
            </div>
          </div>

          {/* Right image */}
          <div className="hidden lg:flex flex-col gap-6 items-start">
            <div className="relative">
              <div className="absolute inset-0 bg-purple-200/50 rounded-[60%_40%_40%_60%/40%_60%_40%_60%] transform -rotate-6"></div>
              <img
                src={familyImage}
                alt="Family reading together"
                className="relative w-64 h-64 object-cover rounded-[60%_40%_40%_60%/40%_60%_40%_60%] shadow-lg"
              />
            </div>
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
      description: 'AI-generated stories tailored to your child\'s interests, age, and reading level. Every story teaches valuable life lessons.',
      color: 'bg-purple-100',
      iconColor: 'text-purple-500',
    },
    {
      icon: Brain,
      title: 'Learning Journeys',
      description: 'Interactive educational paths that adapt to how your child learns best. Build habits and explore topics they love.',
      color: 'bg-yellow-100',
      iconColor: 'text-yellow-600',
    },
    {
      icon: MessageCircle,
      title: 'Chat with Luno',
      description: 'Meet Luno, a friendly AI companion that answers questions, encourages curiosity, and keeps conversations safe and age-appropriate.',
      color: 'bg-cyan-100',
      iconColor: 'text-cyan-600',
    },
    {
      icon: Users,
      title: 'Family Connection',
      description: 'Share stories across generations, build family trees, and create lasting memories together.',
      color: 'bg-pink-100',
      iconColor: 'text-pink-500',
    },
  ];

  return (
    <section id="features" className="py-20 bg-white">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center mb-16">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-100 text-cyan-700 text-sm font-medium mb-4">
            <Star className="h-4 w-4" />
            Features
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-charcoal mb-4 font-heading">
            Everything Kids Need to Learn & Grow
          </h2>
          <p className="text-charcoal-muted text-lg max-w-2xl mx-auto">
            Engaging features designed by educators and powered by cutting-edge AI technology.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="p-6 rounded-2xl bg-white border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              <div className={`w-14 h-14 rounded-xl ${feature.color} flex items-center justify-center mb-5`}>
                <feature.icon className={`h-7 w-7 ${feature.iconColor}`} />
              </div>
              <h3 className="text-xl font-semibold text-charcoal mb-3 font-heading">{feature.title}</h3>
              <p className="text-charcoal-muted text-sm leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SafetySection() {
  const safetyFeatures = [
    'Three-layer AI content safety validation',
    'Real-time conversation monitoring',
    'Parent dashboard with full visibility',
    'Age-appropriate content filtering',
    'No data collection from children',
    'COPPA & GDPR compliant',
  ];

  return (
    <section id="safety" className="py-20 bg-pastel-blue">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white text-cyan-700 text-sm font-medium mb-6">
              <Shield className="h-4 w-4" />
              Safety First
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-charcoal mb-6 font-heading">
              Built with Safety at the Core
            </h2>
            <p className="text-charcoal-muted text-lg mb-8">
              We take child safety seriously. Every interaction is monitored, filtered, and designed to be educational and age-appropriate.
            </p>
            <ul className="space-y-4">
              {safetyFeatures.map((item) => (
                <li key={item} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-cyan flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-charcoal font-medium">{item}</span>
                </li>
              ))}
            </ul>

            {/* Certification badges */}
            <div className="flex items-center gap-4 mt-8">
              <img src={coppaImage} alt="COPPA Certified" className="h-16 object-contain" />
              <img src={kidsafeImage} alt="KidSafe Certified" className="h-16 object-contain" />
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan/20 to-purple-200/30 rounded-3xl transform rotate-3"></div>
            <img
              src={trustImage}
              alt="Parent and child using Yoluno"
              className="relative w-full rounded-3xl shadow-2xl"
            />
            <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl shadow-xl p-4 flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <Award className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-charcoal">100%</p>
                <p className="text-sm text-charcoal-muted">Safe Interactions</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function TestimonialsSection() {
  const testimonials = [
    {
      quote: "My kids absolutely love their daily story time with Yoluno. The stories are engaging and always teach something valuable.",
      author: "Sarah T.",
      role: "Mother of 2",
    },
    {
      quote: "Finally, an AI tool I can trust with my children. The parent dashboard gives me complete peace of mind.",
      author: "Mike R.",
      role: "Father of 3",
    },
    {
      quote: "The learning journeys have transformed how my daughter approaches new topics. She's more curious than ever!",
      author: "Lena K.",
      role: "Mother of 1",
    },
  ];

  return (
    <section className="py-20 bg-white">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center mb-16">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-pink-100 text-pink-700 text-sm font-medium mb-4">
            <Heart className="h-4 w-4" />
            Testimonials
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-charcoal mb-4 font-heading">
            Loved by Families Everywhere
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="p-6 rounded-2xl bg-gradient-to-br from-pastel-pink to-pastel-purple border border-gray-100"
            >
              <p className="text-charcoal mb-6 italic">"{testimonial.quote}"</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-cyan/20 flex items-center justify-center">
                  <span className="text-cyan font-bold">{testimonial.author[0]}</span>
                </div>
                <div>
                  <p className="font-semibold text-charcoal">{testimonial.author}</p>
                  <p className="text-sm text-charcoal-muted">{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="py-20 bg-charcoal">
      <div className="mx-auto max-w-4xl px-6 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 font-heading">
          Ready to Start the Adventure?
        </h2>
        <p className="text-gray-300 text-lg mb-10 max-w-2xl mx-auto">
          Join thousands of families using Yoluno AI to make learning fun, safe, and magical for their children.
        </p>
        <Link to="/signup">
          <Button size="lg" className="bg-cyan hover:bg-cyan-600 text-white rounded-full px-8 py-6 text-lg">
            <Sparkles className="mr-2 h-5 w-5" />
            Get Started Free
          </Button>
        </Link>
        <p className="text-gray-400 text-sm mt-4">No credit card required. Cancel anytime.</p>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="py-12 bg-pastel-blue">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <Link to="/" className="flex items-center">
            <img src={yolunoLogo} alt="Yoluno" className="h-8" />
          </Link>
          <p className="text-charcoal-muted text-sm">
            &copy; {new Date().getFullYear()} Yoluno AI. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-charcoal-muted hover:text-cyan text-sm transition-colors">
              Privacy
            </a>
            <a href="#" className="text-charcoal-muted hover:text-cyan text-sm transition-colors">
              Terms
            </a>
            <a href="#" className="text-charcoal-muted hover:text-cyan text-sm transition-colors">
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
    <div className="min-h-screen bg-white font-sans">
      <Navigation />
      <HeroSection />
      <FeaturesSection />
      <SafetySection />
      <TestimonialsSection />
      <CTASection />
      <Footer />
    </div>
  );
}
