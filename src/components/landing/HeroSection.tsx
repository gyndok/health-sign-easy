import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function HeroSection() {
  const scrollToHowItWorks = () => {
    document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
      <div className="container relative py-20 sm:py-32">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-display leading-tight mb-6 animate-slide-up">
            Informed Consent,{" "}
            <span className="gradient-text">Digitized</span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground mb-10 animate-slide-up max-w-2xl mx-auto" style={{ animationDelay: "0.1s" }}>
            Replace paper consent forms with a secure digital workflow. Create educational modules,
            send invitations, and track patient consent in real time.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <Button size="xl" asChild>
              <Link to="/auth">
                Try Live Demo
                <ArrowRight className="h-5 w-5 ml-2" />
              </Link>
            </Button>
            <Button size="xl" variant="outline" onClick={scrollToHowItWorks}>
              See How It Works
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-6 animate-fade-in" style={{ animationDelay: "0.3s" }}>
            No credit card required. Try the full platform with sample data.
          </p>
        </div>
      </div>
    </section>
  );
}
