import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Shield, 
  ArrowRight, 
  FileText, 
  Video,
  Lock,
  Clock,
  Users,
  AlertTriangle,
  Construction,
} from "lucide-react";

const features = [
  {
    icon: FileText,
    title: "Digital Consent Forms",
    description: "Create custom consent modules with rich text formatting and specialty tags.",
  },
  {
    icon: Video,
    title: "Educational Videos",
    description: "Embed YouTube, Vimeo, or direct video links to educate patients before signing.",
  },
  {
    icon: Lock,
    title: "Security First",
    description: "Building toward HIPAA compliance with secure storage and encryption.",
  },
  {
    icon: Clock,
    title: "Automated Tracking",
    description: "Real-time status updates on pending, viewed, and completed consents.",
  },
];

const stats = [
  { value: "MVP", label: "Development Stage" },
  { value: "Beta", label: "Testing Phase" },
  { value: "In Progress", label: "HIPAA Compliance" },
  { value: "Demo Only", label: "Current Status" },
];

export default function Index() {
  return (
    <div className="min-h-screen bg-background">
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
            <Button variant="ghost" asChild>
              <Link to="/auth">Sign In</Link>
            </Button>
            <Button asChild>
              <Link to="/auth">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* MVP Warning Banner */}
      <section className="bg-amber-500/10 border-b border-amber-500/20">
        <div className="container py-4">
          <div className="flex items-center justify-center gap-3 text-amber-700 dark:text-amber-400">
            <AlertTriangle className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm font-medium text-center">
              <strong>MVP / Demo Only:</strong> This application is under active development and is NOT ready for production use. 
              HIPAA compliance is in progress. Do not use with real patient data.
            </p>
          </div>
        </div>
      </section>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="container relative py-20 sm:py-32">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 text-sm font-medium mb-8 animate-fade-in">
              <Construction className="h-4 w-4" />
              MVP - Demonstration Only
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-display leading-tight mb-6 animate-slide-up">
              Streamline Patient Consent with{" "}
              <span className="gradient-text">Digital Workflows</span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground mb-10 animate-slide-up max-w-2xl mx-auto" style={{ animationDelay: "0.1s" }}>
              Create educational consent modules, send invitations via email or SMS, 
              and track completion in real-time. <strong>Currently in development—for demonstration purposes only.</strong>
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: "0.2s" }}>
              <Button size="xl" asChild>
                <Link to="/auth">
                  Explore Demo
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Link>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-6 animate-fade-in" style={{ animationDelay: "0.3s" }}>
              ⚠️ Working toward HIPAA compliance. Not for use with protected health information.
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y border-border bg-muted/30">
        <div className="container py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div 
                key={stat.label} 
                className="text-center animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <p className="text-3xl sm:text-4xl font-bold font-display text-primary">
                  {stat.value}
                </p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 sm:py-28">
        <div className="container">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold font-display mb-4">
              Everything You Need for Patient Consent
            </h2>
            <p className="text-lg text-muted-foreground">
              A complete solution for healthcare providers to manage informed consent digitally.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="card-interactive p-6 animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="p-3 rounded-xl bg-primary/10 w-fit mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold font-display mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 sm:py-28 bg-amber-600 text-white">
        <div className="container text-center">
          <div className="max-w-2xl mx-auto">
            <Construction className="h-12 w-12 mx-auto mb-6 opacity-80" />
            <h2 className="text-3xl sm:text-4xl font-bold font-display mb-4">
              We're Building Something Great
            </h2>
            <p className="text-lg opacity-90 mb-6">
              ClearConsent is actively under development. We're working toward full HIPAA compliance 
              and enterprise-ready features. Want to explore? Try our demo.
            </p>
            <p className="text-sm opacity-80 mb-8">
              For more information, contact: <a href="mailto:gyndok@yahoo.com" className="underline hover:opacity-100">gyndok@yahoo.com</a>
            </p>
            <Button size="xl" variant="secondary" asChild>
              <Link to="/auth">
                Explore Demo
                <ArrowRight className="h-5 w-5 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12">
        <div className="container">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Shield className="h-4 w-4" />
              </div>
              <span className="font-display text-lg font-bold">ClearConsent</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2025 ClearConsent. MVP - For demonstration purposes only. HIPAA compliance in progress.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
