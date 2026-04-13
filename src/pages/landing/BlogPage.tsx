import { useState } from "react";
import PageCTA from "@/components/landing/PageCTA";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import AnimatedSection from "@/components/landing/AnimatedSection";
import { blogPosts } from "@/data/blogPosts";

const categories = ["All", "For Parents", "How It Works", "Behind the Scenes", "For Educators"];

export default function BlogPage() {
  const [activeCategory, setActiveCategory] = useState("All");

  const filteredPosts = activeCategory === "All"
    ? blogPosts
    : blogPosts.filter((p) => p.category === activeCategory);

  return (
    <main className="pt-20">
      {/* Hero */}
      <section className="section-padding bg-background">
        <div className="container max-w-3xl text-center">
          <AnimatedSection>
            <p className="text-label mb-4">Blog</p>
            <h1 className="font-heading text-4xl md:text-[48px] text-foreground mb-6 font-bold tracking-wide">
              Stories, Updates & Philosophy
            </h1>
            <p className="font-body text-[17px] text-muted-foreground max-w-[560px] mx-auto">
              We publish thoughtfully, not frequently. When we share something here, it's because we think it's genuinely useful.
            </p>
          </AnimatedSection>

          <AnimatedSection delay={0.15}>
            <div className="rounded-2xl overflow-hidden shadow-warm border border-border mt-8">
              <video autoPlay loop muted playsInline className="w-full h-auto">
                <source src="/videos/blog-hero.mp4" type="video/mp4" />
              </video>
            </div>
          </AnimatedSection>

          <AnimatedSection delay={0.2}>
            <div className="mt-10 bg-card rounded-2xl p-8 border border-border max-w-md mx-auto">
              <h3 className="font-heading text-lg text-foreground mb-2">Stay in the Loop</h3>
              <p className="font-body text-sm text-muted-foreground mb-4">
                Get notified when we publish something new. No spam, no fluff.
              </p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="Your email"
                  className="flex-1 px-4 py-2.5 rounded-pill border border-border bg-background font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <Button size="sm" className="rounded-pill px-6">Subscribe →</Button>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Posts */}
      <section className="section-padding bg-secondary">
        <div className="container max-w-4xl">
          <AnimatedSection className="flex flex-wrap gap-3 justify-center mb-12">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`font-body text-sm font-medium px-5 py-2 rounded-pill border transition-colors ${
                  activeCategory === cat
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-primary hover:text-primary"
                }`}
              >
                {cat}
              </button>
            ))}
          </AnimatedSection>

          <div className="grid md:grid-cols-2 gap-6">
            {filteredPosts.map((post, i) => {
              const hasContent = !!post.content;
              const Wrapper = hasContent ? Link : "div";
              const wrapperProps = hasContent ? { to: `/blog/${post.slug}` } : {};

              return (
                <AnimatedSection key={post.slug} delay={i * 0.05}>
                  <Wrapper
                    {...(wrapperProps as any)}
                    className="bg-card rounded-2xl p-8 border border-border hover:shadow-warm-lg transition-all duration-300 hover:-translate-y-1 h-full flex flex-col cursor-pointer group block"
                  >
                    <p className="text-label text-xs mb-3">{post.category}</p>
                    <h3 className="font-heading text-xl text-foreground mb-3 group-hover:text-primary transition-colors">
                      {post.title}
                    </h3>
                    <p className="font-body text-muted-foreground leading-relaxed flex-1 text-[15px]">
                      {post.excerpt}
                    </p>
                    <div className="flex items-center justify-between mt-5 pt-4 border-t border-border">
                      <p className="font-body text-muted-foreground text-xs">{post.author}</p>
                      {hasContent ? (
                        <span className="font-body text-primary text-sm font-medium">Read More →</span>
                      ) : (
                        <span className="font-body text-muted-foreground/50 text-sm">Coming Soon</span>
                      )}
                    </div>
                  </Wrapper>
                </AnimatedSection>
              );
            })}
          </div>
        </div>
      </section>

      {/* Bottom email capture */}
      <section className="section-padding bg-background">
        <div className="container max-w-lg text-center">
          <AnimatedSection>
            <h2 className="font-heading text-2xl text-foreground mb-3">Don't Miss What Matters</h2>
            <p className="font-body text-muted-foreground mb-6">
              We write for parents who want honest answers about children and technology.
            </p>
            <div className="flex gap-2 max-w-sm mx-auto">
              <input
                type="email"
                placeholder="Your email"
                className="flex-1 px-4 py-2.5 rounded-pill border border-border bg-card font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <Button size="sm" className="rounded-pill px-6">Subscribe →</Button>
            </div>
            <p className="font-body text-xs text-muted-foreground mt-3">
              No spam. Unsubscribe anytime. We'll never share your email.
            </p>
          </AnimatedSection>
        </div>
      </section>

      <PageCTA
        heading="Done reading? Let your child start exploring."
        subtitle="Everything we write about — the safety, the AI, the design — you can experience in 14 days, free."
      />
    </main>
  );
}
