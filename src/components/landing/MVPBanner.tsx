import { AlertTriangle } from "lucide-react";

export function MVPBanner() {
  return (
    <div className="bg-amber-50 border-b border-amber-200 dark:bg-amber-950/40 dark:border-amber-800">
      <div className="container py-2.5 flex items-center justify-center gap-2">
        <AlertTriangle className="h-4 w-4 flex-shrink-0 text-amber-600 dark:text-amber-400" />
        <p className="text-xs font-medium text-amber-800 dark:text-amber-300">
          This is an MVP demo &mdash; ClearConsent is not yet HIPAA compliant. Do not use with real patient data.
        </p>
      </div>
    </div>
  );
}
