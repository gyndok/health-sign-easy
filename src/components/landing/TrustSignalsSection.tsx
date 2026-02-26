import { Lock, Shield, FileText, Clock } from "lucide-react";
import { useInView } from "@/hooks/useInView";

const signals = [
  {
    icon: Lock,
    title: "End-to-End Encryption",
    description: "All data encrypted in transit and at rest with industry-standard protocols.",
  },
  {
    icon: Shield,
    title: "Not Yet HIPAA Compliant",
    description: "This is an MVP. HIPAA compliance is on our roadmap. Do not use with real protected health information (PHI).",
  },
  {
    icon: FileText,
    title: "Complete Audit Trail",
    description: "Every consent action is logged with timestamps, IPs, and user context.",
  },
  {
    icon: Clock,
    title: "Real-Time Tracking",
    description: "Know instantly when a patient views, signs, or withdraws consent.",
  },
];

export function TrustSignalsSection() {
  const { ref, isInView } = useInView();

  return (
    <section className="py-20 sm:py-28 border-y border-border bg-muted/30">
      <div className="container" ref={ref}>
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold font-display mb-4">
            Built for Healthcare
          </h2>
          <p className="text-lg text-muted-foreground">
            Security and compliance are foundational, not afterthoughts
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {signals.map((signal, index) => (
            <div
              key={signal.title}
              className={`card-interactive p-6 transition-all duration-500 ${
                isInView
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-4"
              }`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <div className="p-3 rounded-xl bg-primary/10 w-fit mb-4">
                <signal.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold font-display mb-2">{signal.title}</h3>
              <p className="text-sm text-muted-foreground">{signal.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
