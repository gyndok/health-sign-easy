import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ProviderLayout } from "@/components/layout/ProviderLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Save, User, Building, Phone, Mail, Clock, Play, Database, Trash2, CheckCircle2 } from "lucide-react";
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

interface ProfileData {
  full_name: string;
  email: string;
  practice_name: string;
  primary_specialty: string;
  phone: string;
  timezone: string;
}

const timezones = [
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "America/Anchorage", label: "Alaska Time (AKT)" },
  { value: "Pacific/Honolulu", label: "Hawaii Time (HT)" },
];


export default function Settings() {
  const { user, profile } = useAuth();
  const { isDemoMode, enableDemo, disableDemo } = useDemoMode();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
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
  });

  useEffect(() => {
    if (isDemoMode) {
      hasDemoData().then(setDemoDataLoaded);
    }
  }, [isDemoMode]);

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || "",
        email: user?.email || profile.email || "",
        practice_name: profile.practice_name || "",
        primary_specialty: profile.primary_specialty || "",
        phone: profile.phone || "",
        timezone: profile.timezone || "America/Chicago",
      });
    }
  }, [profile]);

  const handleInputChange = (field: keyof ProfileData, value: string) => {
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
    const { error } = await supabase.rpc("update_provider_profile", {
      p_full_name: formData.full_name,
      p_practice_name: formData.practice_name || null,
      p_primary_specialty: formData.primary_specialty || null,
      p_phone: formData.phone || null,
      p_timezone: formData.timezone || "America/Chicago",
    });

    if (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile", { description: error.message });
    } else {
      toast.success("Profile updated successfully");
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
              <Label htmlFor="primary_specialty">Primary Specialty</Label>
              <Input
                id="primary_specialty"
                value={formData.primary_specialty}
                onChange={(e) => handleInputChange("primary_specialty", e.target.value)}
                placeholder="e.g., Dermatology, Plastic Surgery"
              />
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
                  {timezones.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
