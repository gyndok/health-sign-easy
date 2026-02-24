import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { OnboardingLayout } from "@/components/onboarding/OnboardingLayout";
import { StepIndicator } from "@/components/onboarding/StepIndicator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, ArrowRight, SkipForward } from "lucide-react";

const STEPS = ["Personal Info", "Preferences"];

interface PatientFormData {
  first_name: string;
  last_name: string;
  date_of_birth: string;
  phone: string;
  preferred_contact: string;
  email_consent_reminders: boolean;
  email_expiration_alerts: boolean;
  email_provider_updates: boolean;
}

export default function PatientOnboarding() {
  const { profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  // Try to split full_name into first/last
  const nameParts = (profile?.full_name || "").split(" ");
  const defaultFirst = nameParts[0] || "";
  const defaultLast = nameParts.slice(1).join(" ") || "";

  const [formData, setFormData] = useState<PatientFormData>({
    first_name: defaultFirst,
    last_name: defaultLast,
    date_of_birth: "",
    phone: profile?.phone || "",
    preferred_contact: "email",
    email_consent_reminders: true,
    email_expiration_alerts: true,
    email_provider_updates: true,
  });

  const updateField = (field: keyof PatientFormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const saveCurrentStep = async (markComplete: boolean) => {
    setIsSaving(true);
    try {
      const { error } = await supabase.rpc("save_patient_onboarding", {
        p_first_name: formData.first_name || null,
        p_last_name: formData.last_name || null,
        p_date_of_birth: formData.date_of_birth || null,
        p_phone: formData.phone || null,
        p_preferred_contact: formData.preferred_contact,
        p_email_consent_reminders: formData.email_consent_reminders,
        p_email_expiration_alerts: formData.email_expiration_alerts,
        p_email_provider_updates: formData.email_provider_updates,
        p_mark_complete: markComplete,
      });

      if (error) {
        console.error("Error saving onboarding:", error);
        toast.error("Failed to save", { description: error.message });
        setIsSaving(false);
        return false;
      }
      return true;
    } catch (error) {
      console.error("Error saving onboarding:", error);
      const message = error instanceof Error ? error.message : "Unknown error";
      toast.error("Failed to save", { description: message });
      setIsSaving(false);
      return false;
    }
  };

  const handleNext = async () => {
    const saved = await saveCurrentStep(false);
    if (saved) {
      setIsSaving(false);
      if (currentStep < STEPS.length - 1) {
        setCurrentStep((prev) => prev + 1);
      }
    }
  };

  const handleSkip = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleFinish = async () => {
    const saved = await saveCurrentStep(true);
    if (saved) {
      await refreshProfile();
      toast.success("Welcome to ClearConsent!", {
        description: "Your profile is set up.",
      });
      navigate("/patient-dashboard");
    }
    setIsSaving(false);
  };

  const isLastStep = currentStep === STEPS.length - 1;

  return (
    <OnboardingLayout
      title="Welcome to ClearConsent"
      subtitle="Let's set up your patient profile"
    >
      <StepIndicator steps={STEPS} currentStep={currentStep} />

      {/* Step 0: Personal Info */}
      {currentStep === 0 && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">First Name</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => updateField("first_name", e.target.value)}
                placeholder="Jane"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => updateField("last_name", e.target.value)}
                placeholder="Doe"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="date_of_birth">Date of Birth</Label>
            <Input
              id="date_of_birth"
              type="date"
              value={formData.date_of_birth}
              onChange={(e) => updateField("date_of_birth", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => updateField("phone", e.target.value)}
              placeholder="(555) 123-4567"
            />
          </div>
        </div>
      )}

      {/* Step 1: Contact Preferences */}
      {currentStep === 1 && (
        <div className="space-y-6">
          <div className="space-y-3">
            <Label>Preferred Contact Method</Label>
            <div className="grid grid-cols-3 gap-3">
              {(["email", "phone", "text"] as const).map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => updateField("preferred_contact", method)}
                  className={`
                    p-3 rounded-xl border-2 text-sm font-medium capitalize transition-all
                    ${formData.preferred_contact === method
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border hover:border-primary/30 text-muted-foreground"
                    }
                  `}
                >
                  {method}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <Label className="text-base">Notification Preferences</Label>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Consent Reminders</p>
                  <p className="text-xs text-muted-foreground">
                    Get reminded about pending consent forms
                  </p>
                </div>
                <Switch
                  checked={formData.email_consent_reminders}
                  onCheckedChange={(checked) => updateField("email_consent_reminders", checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Expiration Alerts</p>
                  <p className="text-xs text-muted-foreground">
                    Get notified when consent forms are about to expire
                  </p>
                </div>
                <Switch
                  checked={formData.email_expiration_alerts}
                  onCheckedChange={(checked) => updateField("email_expiration_alerts", checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Provider Updates</p>
                  <p className="text-xs text-muted-foreground">
                    Receive updates from your healthcare providers
                  </p>
                </div>
                <Switch
                  checked={formData.email_provider_updates}
                  onCheckedChange={(checked) => updateField("email_provider_updates", checked)}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation buttons */}
      <div className="flex items-center justify-between mt-8 pt-6 border-t">
        <Button
          variant="ghost"
          onClick={handleSkip}
          disabled={isSaving || isLastStep}
          className="text-muted-foreground"
        >
          <SkipForward className="h-4 w-4 mr-2" />
          Skip
        </Button>

        <div className="flex gap-3">
          {currentStep > 0 && (
            <Button
              variant="outline"
              onClick={() => setCurrentStep((prev) => prev - 1)}
              disabled={isSaving}
            >
              Back
            </Button>
          )}
          {isLastStep ? (
            <Button onClick={handleFinish} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <ArrowRight className="h-4 w-4 mr-2" />
              )}
              Finish Setup
            </Button>
          ) : (
            <Button onClick={handleNext} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <ArrowRight className="h-4 w-4 mr-2" />
              )}
              Next
            </Button>
          )}
        </div>
      </div>
    </OnboardingLayout>
  );
}
