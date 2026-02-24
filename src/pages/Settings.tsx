import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ProviderLayout } from "@/components/layout/ProviderLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { useProviderProfile } from "@/hooks/useProviderProfile";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Save, User, Building, Phone, Mail, Clock, Play, Database, Trash2, CheckCircle2, Shield, Stethoscope } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useDemoMode } from "@/hooks/useDemoMode";
import { seedDemoData, clearDemoData, hasDemoData } from "@/services/demoSeedService";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MEDICAL_SPECIALTIES, US_STATES, TIMEZONES, CONSENT_EXPIRY_OPTIONS } from "@/constants/specialties";

interface ProfileData {
  full_name: string;
  email: string;
  practice_name: string;
  primary_specialty: string;
  phone: string;
  timezone: string;
  npi_number: string;
  license_number: string;
  license_state: string;
  practice_address: string;
  practice_city: string;
  practice_state: string;
  practice_zip: string;
  default_consent_expiry_days: number;
}


export default function Settings() {
  const { user, profile } = useAuth();
  const { providerProfile, refreshProviderProfile } = useProviderProfile();
  const { isDemoMode, enableDemo, disableDemo } = useDemoMode();
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [demoDataLoaded, setDemoDataLoaded] = useState(false);
  const [formData, setFormData] = useState<ProfileData>({
    full_name: "",
    email: "",
    practice_name: "",
    primary_specialty: "",
    phone: "",
    timezone: "America/Chicago",
    npi_number: "",
    license_number: "",
    license_state: "",
    practice_address: "",
    practice_city: "",
    practice_state: "",
    practice_zip: "",
    default_consent_expiry_days: 7,
  });

  useEffect(() => {
    if (isDemoMode) {
      hasDemoData().then(setDemoDataLoaded);
    }
  }, [isDemoMode]);

  // Populate from user_profiles (basic fields)
  useEffect(() => {
    if (profile) {
      setFormData((prev) => ({
        ...prev,
        full_name: profile.full_name || "",
        email: user?.email || profile.email || "",
        phone: profile.phone || prev.phone || "",
        practice_name: profile.practice_name || prev.practice_name || "",
        primary_specialty: profile.primary_specialty || prev.primary_specialty || "",
        timezone: profile.timezone || prev.timezone || "America/Chicago",
      }));
    }
  }, [profile]);

  // Populate from provider_profiles (extended fields)
  useEffect(() => {
    if (providerProfile) {
      setFormData((prev) => ({
        ...prev,
        full_name: providerProfile.full_name || prev.full_name,
        phone: providerProfile.phone || prev.phone,
        practice_name: providerProfile.practice_name || prev.practice_name,
        primary_specialty: providerProfile.primary_specialty || prev.primary_specialty,
        timezone: providerProfile.timezone || prev.timezone,
        npi_number: providerProfile.npi_number || "",
        license_number: providerProfile.license_number || "",
        license_state: providerProfile.license_state || "",
        practice_address: providerProfile.practice_address || "",
        practice_city: providerProfile.practice_city || "",
        practice_state: providerProfile.practice_state || "",
        practice_zip: providerProfile.practice_zip || "",
        default_consent_expiry_days: providerProfile.default_consent_expiry_days || 7,
      }));
    }
  }, [providerProfile]);

  const handleInputChange = (field: keyof ProfileData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSeedDemoData = async () => {
    setIsSeeding(true);
    try {
      const result = await seedDemoData();
      if (result.status === "already_seeded") {
        toast.info("Demo data is already loaded");
      } else {
        toast.success("Demo data populated!", {
          description: `Added ${result.modules} modules, ${result.invites} invites, ${result.submissions} submissions`,
        });
        navigate("/dashboard?tour=start");
      }
      setDemoDataLoaded(true);
    } catch (error) {
      console.error("Error seeding demo data:", error);
      const message = error instanceof Error ? error.message : "Unknown error";
      toast.error("Failed to populate demo data", { description: message });
    }
    setIsSeeding(false);
  };

  const handleClearDemoData = async () => {
    setIsClearing(true);
    try {
      await clearDemoData();
      toast.success("Demo data cleared");
      setDemoDataLoaded(false);
    } catch (error) {
      console.error("Error clearing demo data:", error);
      toast.error("Failed to clear demo data");
    }
    setIsClearing(false);
  };

  const handleSave = async () => {
    if (!user) return;

    setIsSaving(true);
    const { data, error } = await supabase.rpc("update_provider_profile", {
      p_full_name: formData.full_name,
      p_practice_name: formData.practice_name || null,
      p_primary_specialty: formData.primary_specialty || null,
      p_phone: formData.phone || null,
      p_timezone: formData.timezone || "America/Chicago",
      p_npi_number: formData.npi_number || null,
      p_license_number: formData.license_number || null,
      p_license_state: formData.license_state || null,
      p_practice_address: formData.practice_address || null,
      p_practice_city: formData.practice_city || null,
      p_practice_state: formData.practice_state || null,
      p_practice_zip: formData.practice_zip || null,
      p_default_consent_expiry_days: formData.default_consent_expiry_days,
    });

    if (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile", { description: error.message });
    } else {
      const result = data as unknown as { status: string; rows_updated: number };
      if (result?.status === "not_found") {
        toast.error("Profile not found", { description: "Your user profile row could not be located. Please contact support." });
      } else {
        toast.success("Profile updated successfully");
        refreshProviderProfile();
      }
    }
    setIsSaving(false);
  };

  return (
    <ProviderLayout>
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold font-display">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage your account and practice information
          </p>
        </div>

        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal Information
            </CardTitle>
            <CardDescription>
              Update your personal details and contact information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => handleInputChange("full_name", e.target.value)}
                  placeholder="Dr. Jane Smith"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    value={formData.email}
                    disabled
                    className="pl-9 bg-muted"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Email cannot be changed
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  placeholder="(555) 123-4567"
                  className="pl-9"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Professional Credentials */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5" />
              Professional Credentials
            </CardTitle>
            <CardDescription>
              Your medical licensing and certification details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="npi_number">NPI Number</Label>
              <Input
                id="npi_number"
                value={formData.npi_number}
                onChange={(e) => handleInputChange("npi_number", e.target.value)}
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
                  onChange={(e) => handleInputChange("license_number", e.target.value)}
                  placeholder="MD-12345"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="license_state">License State</Label>
                <Select
                  value={formData.license_state}
                  onValueChange={(value) => handleInputChange("license_state", value)}
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
                onValueChange={(value) => handleInputChange("primary_specialty", value)}
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
          </CardContent>
        </Card>

        {/* Practice Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Practice Information
            </CardTitle>
            <CardDescription>
              Details about your medical practice
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="practice_name">Practice Name</Label>
              <Input
                id="practice_name"
                value={formData.practice_name}
                onChange={(e) => handleInputChange("practice_name", e.target.value)}
                placeholder="Smith Medical Group"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="practice_address">Street Address</Label>
              <Input
                id="practice_address"
                value={formData.practice_address}
                onChange={(e) => handleInputChange("practice_address", e.target.value)}
                placeholder="123 Medical Center Dr"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="space-y-2 col-span-2 sm:col-span-1">
                <Label htmlFor="practice_city">City</Label>
                <Input
                  id="practice_city"
                  value={formData.practice_city}
                  onChange={(e) => handleInputChange("practice_city", e.target.value)}
                  placeholder="Austin"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="practice_state">State</Label>
                <Select
                  value={formData.practice_state}
                  onValueChange={(value) => handleInputChange("practice_state", value)}
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
                  onChange={(e) => handleInputChange("practice_zip", e.target.value)}
                  placeholder="78701"
                  maxLength={10}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Preferences
            </CardTitle>
            <CardDescription>
              Customize your experience
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Select
                value={formData.timezone}
                onValueChange={(value) => handleInputChange("timezone", value)}
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
                onValueChange={(value) => handleInputChange("default_consent_expiry_days", parseInt(value))}
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
          </CardContent>
        </Card>

        {/* Demo Mode */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              Demo Mode
            </CardTitle>
            <CardDescription>
              Enable a live demo toolbar to switch between provider and patient views — perfect for showcasing ClearConsent to partners.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="demo-toggle">Enable Demo Mode</Label>
                <p className="text-xs text-muted-foreground">
                  Shows a floating toolbar with view switching
                </p>
              </div>
              <Switch
                id="demo-toggle"
                checked={isDemoMode}
                onCheckedChange={(checked) => (checked ? enableDemo() : disableDemo())}
              />
            </div>

            {isDemoMode && (
              <>
                <Separator />
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Demo Data</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Populate your dashboard with sample medical consent data for demonstrations
                    </p>
                  </div>

                  {demoDataLoaded && (
                    <div className="flex items-center gap-2 text-sm text-green-600 bg-green-500/10 rounded-lg px-3 py-2">
                      <CheckCircle2 className="h-4 w-4" />
                      Demo data is loaded
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Button
                      onClick={handleSeedDemoData}
                      disabled={isSeeding || demoDataLoaded}
                      size="sm"
                    >
                      {isSeeding ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Database className="h-4 w-4 mr-2" />
                      )}
                      Populate Demo Data
                    </Button>
                    {demoDataLoaded && (
                      <Button
                        variant="outline"
                        onClick={handleClearDemoData}
                        disabled={isClearing}
                        size="sm"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        {isClearing ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4 mr-2" />
                        )}
                        Clear Demo Data
                      </Button>
                    )}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isSaving} size="lg">
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Changes
          </Button>
        </div>
      </div>
    </ProviderLayout>
  );
}
