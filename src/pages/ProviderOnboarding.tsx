import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { OnboardingLayout } from "@/components/onboarding/OnboardingLayout";
import { StepIndicator } from "@/components/onboarding/StepIndicator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, ArrowRight, SkipForward } from "lucide-react";
import { MEDICAL_SPECIALTIES, US_STATES, TIMEZONES, CONSENT_EXPIRY_OPTIONS } from "@/constants/specialties";

const STEPS = ["Personal", "Credentials", "Practice", "Preferences"];

interface ProviderFormData {
  full_name: string;
  phone: string;
  npi_number: string;
  license_number: string;
  license_state: string;
  primary_specialty: string;
  practice_name: string;
  practice_address: string;
  practice_city: string;
  practice_state: string;
  practice_zip: string;
  timezone: string;
  default_consent_expiry_days: number;
}

export default function ProviderOnboarding() {
  const { profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<ProviderFormData>({
    full_name: profile?.full_name || "",
    phone: profile?.phone || "",
    npi_number: "",
    license_number: "",
    license_state: "",
    primary_specialty: profile?.primary_specialty || "",
    practice_name: profile?.practice_name || "",
    practice_address: "",
    practice_city: "",
    practice_state: "",
    practice_zip: "",
    timezone: profile?.timezone || "America/Chicago",
    default_consent_expiry_days: 7,
  });

  const updateField = (field: keyof ProviderFormData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const saveCurrentStep = async (markComplete: boolean) => {
    setIsSaving(true);
    try {
      const { error } = await supabase.rpc("save_provider_onboarding", {
        p_full_name: formData.full_name || null,
        p_phone: formData.phone || null,
        p_npi_number: formData.npi_number || null,
        p_license_number: formData.license_number || null,
        p_license_state: formData.license_state || null,
        p_primary_specialty: formData.primary_specialty || null,
        p_practice_name: formData.practice_name || null,
        p_practice_address: formData.practice_address || null,
        p_practice_city: formData.practice_city || null,
        p_practice_state: formData.practice_state || null,
        p_practice_zip: formData.practice_zip || null,
        p_timezone: formData.timezone || null,
        p_default_consent_expiry_days: formData.default_consent_expiry_days,
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
        description: "Your profile is set up. Let's get started.",
      });
      navigate("/dashboard");
    }
    setIsSaving(false);
  };

  const isLastStep = currentStep === STEPS.length - 1;

  return (
    <OnboardingLayout
      title="Set Up Your Profile"
      subtitle="Tell us about yourself and your practice to get started"
    >
      <StepIndicator steps={STEPS} currentStep={currentStep} />

      {/* Step 0: Personal Info */}
      {currentStep === 0 && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name</Label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={(e) => updateField("full_name", e.target.value)}
              placeholder="Dr. Jane Smith"
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

      {/* Step 1: Credentials */}
      {currentStep === 1 && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="npi_number">NPI Number</Label>
            <Input
              id="npi_number"
              value={formData.npi_number}
              onChange={(e) => updateField("npi_number", e.target.value)}
              placeholder="1234567890"
              maxLength={10}
            />
            <p className="text-xs text-muted-foreground">
              10-digit National Provider Identifier
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="license_number">License Number</Label>
              <Input
                id="license_number"
                value={formData.license_number}
                onChange={(e) => updateField("license_number", e.target.value)}
                placeholder="MD-12345"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="license_state">License State</Label>
              <Select
                value={formData.license_state}
                onValueChange={(value) => updateField("license_state", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  {US_STATES.map((state) => (
                    <SelectItem key={state.value} value={state.value}>
                      {state.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="primary_specialty">Primary Specialty</Label>
            <Select
              value={formData.primary_specialty}
              onValueChange={(value) => updateField("primary_specialty", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select specialty" />
              </SelectTrigger>
              <SelectContent>
                {MEDICAL_SPECIALTIES.map((specialty) => (
                  <SelectItem key={specialty} value={specialty}>
                    {specialty}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Step 2: Practice */}
      {currentStep === 2 && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="practice_name">Practice Name</Label>
            <Input
              id="practice_name"
              value={formData.practice_name}
              onChange={(e) => updateField("practice_name", e.target.value)}
              placeholder="Smith Medical Group"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="practice_address">Street Address</Label>
            <Input
              id="practice_address"
              value={formData.practice_address}
              onChange={(e) => updateField("practice_address", e.target.value)}
              placeholder="123 Medical Center Dr"
            />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="space-y-2 col-span-2 sm:col-span-1">
              <Label htmlFor="practice_city">City</Label>
              <Input
                id="practice_city"
                value={formData.practice_city}
                onChange={(e) => updateField("practice_city", e.target.value)}
                placeholder="Austin"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="practice_state">State</Label>
              <Select
                value={formData.practice_state}
                onValueChange={(value) => updateField("practice_state", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="State" />
                </SelectTrigger>
                <SelectContent>
                  {US_STATES.map((state) => (
                    <SelectItem key={state.value} value={state.value}>
                      {state.value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="practice_zip">ZIP</Label>
              <Input
                id="practice_zip"
                value={formData.practice_zip}
                onChange={(e) => updateField("practice_zip", e.target.value)}
                placeholder="78701"
                maxLength={10}
              />
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Preferences */}
      {currentStep === 3 && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Select
              value={formData.timezone}
              onValueChange={(value) => updateField("timezone", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select timezone" />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONES.map((tz) => (
                  <SelectItem key={tz.value} value={tz.value}>
                    {tz.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="consent_expiry">Default Consent Expiry</Label>
            <Select
              value={String(formData.default_consent_expiry_days)}
              onValueChange={(value) => updateField("default_consent_expiry_days", parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select expiry period" />
              </SelectTrigger>
              <SelectContent>
                {CONSENT_EXPIRY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={String(opt.value)}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              How long patients have to complete consent forms before they expire
            </p>
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
