import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function MVPBanner() {
  const [isDismissed, setIsDismissed] = useState(() => {
    return sessionStorage.getItem("mvp_banner_dismissed") === "true";
  });

  if (isDismissed) return null;

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem("mvp_banner_dismissed", "true");
  };

  return (
    <div className="bg-amber-500/10 border-b border-amber-500/20">
      <div className="container py-2.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 flex-1 justify-center">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <p className="text-xs font-medium">
            This product is in active development. Not for production use with real patient data.
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20 flex-shrink-0"
          onClick={handleDismiss}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
