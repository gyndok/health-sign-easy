import { useState } from "react";
import { Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function MVPBanner() {
  const [isDismissed, setIsDismissed] = useState(() => {
    return sessionStorage.getItem("beta_banner_dismissed") === "true";
  });

  if (isDismissed) return null;

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem("beta_banner_dismissed", "true");
  };

  return (
    <div className="bg-primary/5 border-b border-primary/10">
      <div className="container py-2.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-primary flex-1 justify-center">
          <Sparkles className="h-4 w-4 flex-shrink-0" />
          <p className="text-xs font-medium">
            Now in Beta &mdash; Try ClearConsent free during our early access period.
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-primary hover:bg-primary/10 flex-shrink-0"
          onClick={handleDismiss}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
