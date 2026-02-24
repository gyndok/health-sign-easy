import { Check } from "lucide-react";

interface StepIndicatorProps {
  steps: string[];
  currentStep: number;
}

export function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {steps.map((label, index) => {
        const isCompleted = index < currentStep;
        const isCurrent = index === currentStep;

        return (
          <div key={label} className="flex items-center gap-2">
            {/* Step dot */}
            <div className="flex items-center gap-2">
              <div
                className={`
                  flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium transition-all
                  ${isCompleted
                    ? "bg-primary text-primary-foreground"
                    : isCurrent
                      ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                      : "bg-muted text-muted-foreground"
                  }
                `}
              >
                {isCompleted ? <Check className="h-4 w-4" /> : index + 1}
              </div>
              <span
                className={`
                  text-sm hidden sm:inline
                  ${isCurrent ? "font-medium text-foreground" : "text-muted-foreground"}
                `}
              >
                {label}
              </span>
            </div>

            {/* Connector line */}
            {index < steps.length - 1 && (
              <div
                className={`
                  h-0.5 w-8 sm:w-12 transition-all
                  ${index < currentStep ? "bg-primary" : "bg-muted"}
                `}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
