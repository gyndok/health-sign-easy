import { useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, X, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useProviderProfile } from "@/hooks/useProviderProfile";

export function OnboardingBanner() {
  const { role } = useAuth();
  const { providerProfile, isLoading } = useProviderProfile();
  const [isDismissed, setIsDismissed] = useState(() => {
    return sessionStorage.getItem("clearconsent_banner_dismissed") === "true";
  });

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem("clearconsent_banner_dismissed", "true");
  };

  if (isDismissed || isLoading) return null;

  // Only show for providers with incomplete profiles
  if (role !== "provider" || !providerProfile) return null;

  // Check if key fields are missing
  const missingFields: string[] = [];
  if (!providerProfile.npi_number) missingFields.push("NPI number");
  if (!providerProfile.license_number) missingFields.push("license number");
  if (!providerProfile.practice_name) missingFields.push("practice name");
  if (!providerProfile.primary_specialty) missingFields.push("specialty");

  // If profile is complete, don't show banner
  if (missingFields.length === 0) return null;

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-amber-900">
            Your profile is incomplete
          </p>
          <p className="text-xs text-amber-700 truncate">
            Missing: {missingFields.join(", ")}. Complete your profile to build trust with patients.
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Button variant="outline" size="sm" asChild className="border-amber-300 text-amber-900 hover:bg-amber-100">
          <Link to="/settings">
            Complete Profile
            <ArrowRight className="h-3 w-3 ml-1" />
          </Link>
        </Button>
        <button
          onClick={handleDismiss}
          className="p-1 rounded hover:bg-amber-200/50 text-amber-600"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function PatientOnboardingBanner() {
  const [isDismissed, setIsDismissed] = useState(() => {
    return sessionStorage.getItem("clearconsent_patient_banner_dismissed") === "true";
  });

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem("clearconsent_patient_banner_dismissed", "true");
  };

  if (isDismissed) return null;

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-amber-900">
            Complete your profile
          </p>
          <p className="text-xs text-amber-700">
            Update your personal details in settings for a better experience.
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Button variant="outline" size="sm" asChild className="border-amber-300 text-amber-900 hover:bg-amber-100">
          <Link to="/patient-settings">
            Settings
            <ArrowRight className="h-3 w-3 ml-1" />
          </Link>
        </Button>
        <button
          onClick={handleDismiss}
          className="p-1 rounded hover:bg-amber-200/50 text-amber-600"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
