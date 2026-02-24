import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function CTASection() {
  return (
    <section className="py-20 sm:py-28 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
      <div className="container text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold font-display mb-4">
            See It in Action
          </h2>
          <p className="text-lg opacity-90 mb-8">
            Create a consent module, send an invitation, and watch the entire patient
            signing experience — all in under 5 minutes.
          </p>
          <Button size="xl" variant="secondary" asChild>
            <Link to="/auth">
              Try the Live Demo
              <ArrowRight className="h-5 w-5 ml-2" />
            </Link>
          </Button>
          <p className="text-sm opacity-70 mt-4">
            No credit card required. Demo account with sample data.
          </p>
        </div>
      </div>
    </section>
  );
}
