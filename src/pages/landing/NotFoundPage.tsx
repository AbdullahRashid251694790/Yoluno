import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import lunoImg from "@/assets/landing/luno.png";

export default function NotFoundPage() {
  return (
    <main className="min-h-screen flex items-center justify-center section-padding bg-background">
      <div className="text-center max-w-md">
        <img src={lunoImg} alt="Luno looking confused" className="w-32 h-32 object-contain mx-auto mb-8 animate-float" />
        <h1 className="font-heading text-3xl font-bold text-foreground mb-4">
          Hmm, this path doesn't seem to lead anywhere.
        </h1>
        <p className="font-body text-muted-foreground mb-8">
          Let's go back to a place we know.
        </p>
        <Button asChild>
          <Link to="/">Go Home</Link>
        </Button>
      </div>
    </main>
  );
}
