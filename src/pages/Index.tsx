import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Shield, 
  ArrowRight, 
  CheckCircle2, 
  FileText, 
  Video,
  Lock,
  Clock,
  Users,
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
    title: "HIPAA Compliant",
    description: "End-to-end encryption and secure storage meeting healthcare compliance standards.",
  },
  {
    icon: Clock,
    title: "Automated Tracking",
    description: "Real-time status updates on pending, viewed, and completed consents.",
  },
];

const stats = [
  { value: "10,000+", label: "Consents Signed" },
  { value: "500+", label: "Healthcare Providers" },
  { value: "99.9%", label: "Uptime Guarantee" },
  { value: "<2min", label: "Average Sign Time" },
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
            <span className="font-display text-xl font-bold">ConsentFlow</span>
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

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="container relative py-20 sm:py-32">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8 animate-fade-in">
              <CheckCircle2 className="h-4 w-4" />
              HIPAA-Compliant Consent Management
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-display leading-tight mb-6 animate-slide-up">
              Streamline Patient Consent with{" "}
              <span className="gradient-text">Digital Workflows</span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground mb-10 animate-slide-up max-w-2xl mx-auto" style={{ animationDelay: "0.1s" }}>
              Create educational consent modules, send invitations via email or SMS, 
              and track completion in real-time. All secured with enterprise-grade encryption.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: "0.2s" }}>
              <Button size="xl" asChild>
                <Link to="/auth">
                  Start Free Trial
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Link>
              </Button>
              <Button size="xl" variant="outline" asChild>
                <Link to="/consent/demo">
                  View Demo
                </Link>
              </Button>
            </div>
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
      <section className="py-20 sm:py-28 bg-primary text-primary-foreground">
        <div className="container text-center">
          <div className="max-w-2xl mx-auto">
            <Users className="h-12 w-12 mx-auto mb-6 opacity-80" />
            <h2 className="text-3xl sm:text-4xl font-bold font-display mb-4">
              Ready to Modernize Your Consent Workflow?
            </h2>
            <p className="text-lg opacity-90 mb-8">
              Join hundreds of healthcare providers who trust ConsentFlow for secure, 
              efficient patient consent management.
            </p>
            <Button size="xl" variant="secondary" asChild>
              <Link to="/auth">
                Get Started Today
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
              <span className="font-display text-lg font-bold">ConsentFlow</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 ConsentFlow. All rights reserved. HIPAA Compliant.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
