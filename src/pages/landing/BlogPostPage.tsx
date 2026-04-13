import { useParams, Link, Navigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import AnimatedSection from "@/components/landing/AnimatedSection";
import { blogPosts } from "@/data/blogPosts";

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const post = blogPosts.find((p) => p.slug === slug);

  if (!post || !post.content) {
    return <Navigate to="/blog" replace />;
  }

  const renderContent = (content: string) => {
    const blocks = content.split("\n\n");
    return blocks.map((block, i) => {
      const trimmed = block.trim();
      if (!trimmed) return null;

      if (trimmed.startsWith("## ")) {
        return (
          <h2 key={i} className="font-heading text-[24px] md:text-[28px] text-foreground mt-10 mb-5">
            {trimmed.replace("## ", "")}
          </h2>
        );
      }

      if (trimmed.startsWith("1. ") || /^\d+\.\s/.test(trimmed)) {
        const items = trimmed.split("\n").filter(Boolean);
        return (
          <ol key={i} className="list-decimal pl-5 space-y-2 font-body text-[16px] text-muted-foreground leading-[1.75] marker:text-muted-foreground/50 mb-4">
            {items.map((item, j) => (
              <li key={j}>{item.replace(/^\d+\.\s/, "")}</li>
            ))}
          </ol>
        );
      }

      if (trimmed.startsWith("*") && trimmed.endsWith("*") && !trimmed.startsWith("**")) {
        return (
          <p key={i} className="font-body text-[15px] text-muted-foreground/80 italic leading-[1.75] mb-4">
            {trimmed.replace(/^\*|\*$/g, "")}
          </p>
        );
      }

      return (
        <p key={i} className="font-body text-[16px] text-foreground leading-[1.75] mb-4">
          {trimmed}
        </p>
      );
    });
  };

  return (
    <main className="pt-20 bg-background">
      <div className="max-w-[800px] mx-auto px-6 md:px-12 pt-[60px] pb-[100px]">
        <AnimatedSection>
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 font-body text-[14px] text-muted-foreground hover:text-foreground transition-colors mb-10"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Blog
          </Link>

          <p className="font-body text-[12.5px] font-semibold uppercase tracking-[2.5px] text-primary mb-4">
            {post.category}
          </p>
          <h1 className="font-heading text-[32px] md:text-[42px] text-foreground mb-4 leading-[1.15]">
            {post.title}
          </h1>
          <p className="font-body text-[17px] text-muted-foreground leading-[1.7] mb-6">
            {post.subtitle}
          </p>
          <div className="flex items-center gap-3 font-body text-[13px] text-muted-foreground/70 mb-10">
            <span>{post.author}</span>
            <span>·</span>
            <span>{post.date}</span>
          </div>

          <hr className="border-border mb-10" />
        </AnimatedSection>

        <AnimatedSection delay={0.15}>
          <article className="prose-yoluno">
            {renderContent(post.content)}
          </article>
        </AnimatedSection>

        <hr className="border-border my-12" />

        <AnimatedSection delay={0.2}>
          <div className="text-center">
            <p className="font-body text-muted-foreground text-[15px] mb-4">
              Questions or thoughts? We'd love to hear from you.
            </p>
            <a href="mailto:hello@yoluno.com" className="text-primary font-body font-medium hover:underline">
              hello@yoluno.com
            </a>
          </div>
        </AnimatedSection>
      </div>
    </main>
  );
}
