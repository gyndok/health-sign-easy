import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { MVPBanner } from "@/components/landing/MVPBanner";
import { HeroSection } from "@/components/landing/HeroSection";
import { ProductPreview } from "@/components/landing/ProductPreview";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { TrustSignalsSection } from "@/components/landing/TrustSignalsSection";
import { CTASection } from "@/components/landing/CTASection";
import { LandingFooter } from "@/components/landing/LandingFooter";

export default function Index() {
  return (
    <div className="min-h-screen bg-background">
      <MVPBanner />

      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Shield className="h-5 w-5" />
            </div>
            <span className="font-display text-xl font-bold">ClearConsent</span>
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button variant="ghost" asChild>
              <Link to="/auth">Sign In</Link>
            </Button>
            <Button asChild>
              <Link to="/auth">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      <HeroSection />
      <ProductPreview />
      <HowItWorksSection />
      <TrustSignalsSection />
      <CTASection />
      <LandingFooter />
    </div>
  );
}
