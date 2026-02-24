import { ReactNode } from "react";
import { Shield } from "lucide-react";

interface OnboardingLayoutProps {
  children: ReactNode;
  title: string;
  subtitle: string;
}

export function OnboardingLayout({ children, title, subtitle }: OnboardingLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Logo */}
      <div className="absolute top-6 left-6 flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Shield className="h-5 w-5" />
        </div>
        <span className="font-display text-xl font-bold">ClearConsent</span>
      </div>

      {/* Center content */}
      <div className="flex min-h-screen items-center justify-center px-4 py-20">
        <div className="w-full max-w-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold font-display">{title}</h1>
            <p className="text-muted-foreground mt-2">{subtitle}</p>
          </div>

          {/* Card content */}
          <div className="bg-card rounded-2xl border shadow-sm p-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
