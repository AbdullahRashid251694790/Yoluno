import AnimatedSection from "@/components/landing/AnimatedSection";

const posts = [
  { title: "Why We Built a World, Not an App", category: "Philosophy", date: "Coming soon", excerpt: "The thinking behind Yoluno's closed, intentional approach to children's technology." },
  { title: "Meet the Characters of Yoluno", category: "Stories", date: "Coming soon", excerpt: "How Luno, Lolo, Lumi, and Lala came to life — and what makes each one special." },
  { title: "What 'Parent Sovereignty' Really Means", category: "For Educators", date: "Coming soon", excerpt: "Why we believe parents should govern every aspect of their child's digital world." },
  { title: "The Art of Gentle Redirection", category: "Philosophy", date: "Coming soon", excerpt: "How Yoluno handles curiosity that crosses boundaries — without fear or shame." },
  { title: "Stories That Wait", category: "Updates", date: "Coming soon", excerpt: "Why we designed stories to be created slowly, revisited thoughtfully, and allowed to rest." },
  { title: "Bringing Family Memories Into Yoluno", category: "Stories", date: "Coming soon", excerpt: "How the Family space helps children connect with the people and moments that matter most." },
];

const categories = ["All", "Stories", "Updates", "Philosophy", "For Educators"];

export default function BlogPage() {
  return (
    <main className="pt-20">
      <section className="section-padding" style={{ background: 'linear-gradient(180deg, #FFFDF7 0%, #E8F8F4 100%)' }}>
        <div className="container max-w-3xl text-center">
          <AnimatedSection>
            <p className="text-label mb-4">Blog</p>
            <h1 className="font-heading-landing text-4xl md:text-5xl font-bold text-foreground mb-6">
              Stories, Updates & Philosophy
            </h1>
          </AnimatedSection>

          <AnimatedSection delay={0.2}>
            <div className="rounded-3xl overflow-hidden shadow-warm-lg mt-8">
              <video
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-auto"
              >
                <source src="/videos/blog-hero.mp4" type="video/mp4" />
              </video>
            </div>
          </AnimatedSection>
        </div>
      </section>

      <section className="section-padding bg-background">
        <div className="container max-w-4xl">
          <AnimatedSection className="flex flex-wrap gap-3 justify-center mb-12">
            {categories.map((cat) => (
              <button
                key={cat}
                className="font-body text-sm font-semibold px-5 py-2 rounded-pill border border-border text-muted-foreground hover:border-primary hover:text-primary transition-colors"
              >
                {cat}
              </button>
            ))}
          </AnimatedSection>

          <div className="grid md:grid-cols-2 gap-6">
            {posts.map((post, i) => (
              <AnimatedSection key={i} delay={i * 0.05}>
                <div className="bg-card rounded-2xl p-8 shadow-warm hover:shadow-warm-lg transition-all duration-300 hover:-translate-y-1 h-full flex flex-col cursor-pointer">
                  <p className="text-label text-xs mb-3">{post.category}</p>
                  <h3 className="font-heading-landing text-xl font-bold text-foreground mb-3">{post.title}</h3>
                  <p className="font-body text-muted-foreground leading-relaxed flex-1">{post.excerpt}</p>
                  <p className="font-body text-stone text-sm mt-4">{post.date}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
