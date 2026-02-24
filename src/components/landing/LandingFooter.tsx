import { Shield } from "lucide-react";

export function LandingFooter() {
  return (
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
            &copy; 2026 ClearConsent. HIPAA compliance in progress.
          </p>
        </div>
      </div>
    </footer>
  );
}
