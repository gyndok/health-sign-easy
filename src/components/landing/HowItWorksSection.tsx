import { FileText, Send, CheckCircle2 } from "lucide-react";
import { useInView } from "@/hooks/useInView";

const steps = [
  {
    number: 1,
    title: "Create",
    description: "Build consent modules with procedure details, risk disclosures, and educational videos. Use AI to draft consent text instantly.",
    icon: FileText,
  },
  {
    number: 2,
    title: "Send",
    description: "Email a secure consent link to your patient. They can review materials on any device, at their own pace.",
    icon: Send,
  },
  {
    number: 3,
    title: "Sign",
    description: "Patients acknowledge risks, watch educational content, and sign digitally. A PDF is generated and stored automatically.",
    icon: CheckCircle2,
  },
];

export function HowItWorksSection() {
  const { ref, isInView } = useInView();

  return (
    <section id="how-it-works" className="py-20 sm:py-28 bg-muted/30">
      <div className="container" ref={ref}>
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold font-display mb-4">
            How It Works
          </h2>
          <p className="text-lg text-muted-foreground">
            Three simple steps to modernize your consent process
          </p>
        </div>

        <div className="relative max-w-4xl mx-auto">
          {/* Connector line (desktop only) */}
          <div className="hidden md:block absolute top-16 left-[16.67%] right-[16.67%] h-0.5 bg-border" />

          <div className="grid md:grid-cols-3 gap-8 md:gap-12">
            {steps.map((step, index) => (
              <div
                key={step.number}
                className={`text-center transition-all duration-500 ${
                  isInView
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-4"
                }`}
                style={{ transitionDelay: `${index * 150}ms` }}
              >
                {/* Numbered circle */}
                <div className="relative mx-auto mb-6">
                  <div className="h-14 w-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto shadow-md">
                    <step.icon className="h-6 w-6" />
                  </div>
                  <span className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-accent text-accent-foreground text-xs font-bold flex items-center justify-center">
                    {step.number}
                  </span>
                </div>

                <h3 className="text-xl font-semibold font-display mb-3">
                  {step.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
