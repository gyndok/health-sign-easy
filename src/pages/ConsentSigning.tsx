import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Shield, 
  Video, 
  FileText, 
  CheckCircle2,
  AlertCircle,
  Building2,
  User,
  Calendar,
  Loader2,
  UserPlus,
  UserCheck,
  Mail,
  Phone,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface InviteData {
  id: string;
  token: string;
  patient_email: string;
  patient_first_name: string | null;
  patient_last_name: string | null;
  custom_message: string | null;
  status: string;
  expires_at: string;
  consent_modules: {
    id: string;
    name: string;
    description: string | null;
    video_url: string | null;
  } | null;
  provider_profiles: {
    full_name: string;
    practice_name: string | null;
  } | null;
}

type OnboardingMode = "choice" | "guest" | "account" | "complete";

export default function ConsentSigning() {
  const { token } = useParams();
  const navigate = useNavigate();
  
  const [isLoading, setIsLoading] = useState(true);
  const [invite, setInvite] = useState<InviteData | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Onboarding state
  const [onboardingMode, setOnboardingMode] = useState<OnboardingMode>("choice");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [preferredContact, setPreferredContact] = useState("email");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // Consent state
  const [videoWatched, setVideoWatched] = useState(false);
  const [materialsReviewed, setMaterialsReviewed] = useState(false);
  const [agreementChecked, setAgreementChecked] = useState(false);
  const [signature, setSignature] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (token) {
      fetchInvite();
    }
  }, [token]);

  const fetchInvite = async () => {
    if (!token) return;

    setIsLoading(true);
    
    // Fetch invite with module and provider info
    const { data, error } = await supabase
      .from("invites")
      .select(`
        *,
        consent_modules (
          id,
          name,
          description,
          video_url
        )
      `)
      .eq("token", token)
      .maybeSingle();

    if (error) {
      console.error("Error fetching invite:", error);
      setError("Failed to load consent form");
      setIsLoading(false);
      return;
    }

    if (!data) {
      setError("This consent link is invalid or has expired");
      setIsLoading(false);
      return;
    }

    // Check if expired
    if (new Date(data.expires_at) < new Date()) {
      setError("This consent link has expired. Please request a new one from your provider.");
      setIsLoading(false);
      return;
    }

    // Check if already completed
    if (data.status === "completed") {
      setError("This consent form has already been signed.");
      setIsLoading(false);
      return;
    }

    // Fetch provider profile separately
    const { data: providerData } = await supabase
      .from("provider_profiles")
      .select("full_name, practice_name")
      .eq("user_id", data.created_by)
      .maybeSingle();

    const inviteWithProvider = {
      ...data,
      provider_profiles: providerData,
    } as InviteData;

    setInvite(inviteWithProvider);
    setEmail(data.patient_email);
    
    // If patient info already exists, skip to consent
    if (data.patient_first_name && data.patient_last_name) {
      setFirstName(data.patient_first_name);
      setLastName(data.patient_last_name);
      setOnboardingMode("complete");
    }

    // Update status to viewed if pending
    if (data.status === "pending") {
      await supabase
        .from("invites")
        .update({ status: "viewed", viewed_at: new Date().toISOString() })
        .eq("id", data.id);
    }

    setIsLoading(false);
  };

  const handleGuestContinue = async () => {
    if (!firstName.trim() || !lastName.trim() || !dateOfBirth) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Update invite with patient info
    const { error } = await supabase
      .from("invites")
      .update({
        patient_first_name: firstName.trim(),
        patient_last_name: lastName.trim(),
      })
      .eq("id", invite?.id);

    if (error) {
      console.error("Error updating invite:", error);
      toast.error("Failed to save your information");
      return;
    }

    setOnboardingMode("complete");
  };

  const handleAccountCreate = async () => {
    if (!firstName.trim() || !lastName.trim() || !dateOfBirth) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setIsSubmitting(true);

    // Create account
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: {
          role: "patient",
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          date_of_birth: dateOfBirth,
          phone: phone.trim() || null,
          preferred_contact: preferredContact,
        },
      },
    });

    if (authError) {
      console.error("Error creating account:", authError);
      toast.error(authError.message);
      setIsSubmitting(false);
      return;
    }

    // Update invite with patient info and user_id
    await supabase
      .from("invites")
      .update({
        patient_first_name: firstName.trim(),
        patient_last_name: lastName.trim(),
        patient_user_id: authData.user?.id,
      })
      .eq("id", invite?.id);

    toast.success("Account created! You can now sign the consent.");
    setOnboardingMode("complete");
    setIsSubmitting(false);
  };

  const handleSubmit = async () => {
    if (!canSubmit || !invite) return;

    setIsSubmitting(true);

    // Create consent submission
    const { error } = await supabase
      .from("consent_submissions")
      .insert({
        invite_id: invite.id,
        module_id: invite.consent_modules?.id,
        provider_id: invite.provider_profiles ? undefined : undefined,
        patient_first_name: firstName,
        patient_last_name: lastName,
        patient_email: email,
        signature: signature.trim(),
      });

    if (error) {
      console.error("Error submitting consent:", error);
      toast.error("Failed to submit consent. Please try again.");
      setIsSubmitting(false);
      return;
    }

    // Update invite status to completed
    await supabase
      .from("invites")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", invite.id);

    setIsComplete(true);
    toast.success("Consent submitted successfully!");
    setIsSubmitting(false);
  };

  const canSubmit = 
    (invite?.consent_modules?.video_url ? videoWatched : true) && 
    materialsReviewed && 
    agreementChecked && 
    signature.trim().length > 0;

  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="h-10 w-10 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold font-display mb-3">Unable to Load Consent</h1>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (isComplete) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center animate-scale-in">
          <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="h-10 w-10 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold font-display mb-3">
            Consent Submitted Successfully
          </h1>
          <p className="text-muted-foreground mb-6">
            Thank you, {firstName}. Your signed consent has been securely recorded.
          </p>
          <div className="p-4 rounded-xl bg-muted text-left">
            <div className="flex items-center gap-2 text-sm mb-2">
              <FileText className="h-4 w-4 text-primary" />
              <span className="font-medium">{invite?.consent_modules?.name}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Signed on {currentDate} by {signature}
            </p>
          </div>
          <p className="text-sm text-muted-foreground mt-6">
            You may close this window.
          </p>
        </div>
      </div>
    );
  }

  // Onboarding: Choice screen
  if (onboardingMode === "choice") {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
          <div className="container flex h-16 items-center">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Shield className="h-5 w-5" />
              </div>
              <span className="font-display text-xl font-bold">ClearConsent</span>
            </div>
          </div>
        </header>

        <main className="container py-12 max-w-2xl">
          <div className="text-center mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold font-display mb-3">
              Welcome
            </h1>
            <p className="text-muted-foreground">
              You've been invited to sign a consent form by{" "}
              <strong>{invite?.provider_profiles?.full_name || "your provider"}</strong>
              {invite?.provider_profiles?.practice_name && (
                <> from <strong>{invite.provider_profiles.practice_name}</strong></>
              )}
            </p>
          </div>

          {invite?.custom_message && (
            <div className="card-elevated p-4 mb-8 bg-primary/5 border-primary/20">
              <p className="text-sm italic">"{invite.custom_message}"</p>
              <p className="text-xs text-muted-foreground mt-2">
                — {invite.provider_profiles?.full_name}
              </p>
            </div>
          )}

          <div className="card-elevated p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="h-5 w-5 text-primary" />
              <h2 className="font-semibold">{invite?.consent_modules?.name}</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Before signing, we need a few details from you.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <button
              onClick={() => setOnboardingMode("guest")}
              className="card-interactive p-6 text-left hover:border-primary transition-colors"
            >
              <UserCheck className="h-8 w-8 text-primary mb-4" />
              <h3 className="font-semibold mb-2">Continue as Guest</h3>
              <p className="text-sm text-muted-foreground">
                Sign this consent without creating an account. Quick and easy.
              </p>
            </button>

            <button
              onClick={() => setOnboardingMode("account")}
              className="card-interactive p-6 text-left hover:border-primary transition-colors"
            >
              <UserPlus className="h-8 w-8 text-primary mb-4" />
              <h3 className="font-semibold mb-2">Create an Account</h3>
              <p className="text-sm text-muted-foreground">
                Save your information for future consent forms and access your history.
              </p>
            </button>
          </div>
        </main>
      </div>
    );
  }

  // Onboarding: Guest or Account form
  if (onboardingMode === "guest" || onboardingMode === "account") {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
          <div className="container flex h-16 items-center">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Shield className="h-5 w-5" />
              </div>
              <span className="font-display text-xl font-bold">ClearConsent</span>
            </div>
          </div>
        </header>

        <main className="container py-8 max-w-lg">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setOnboardingMode("choice")}
            className="mb-6"
          >
            ← Back
          </Button>

          <h1 className="text-2xl font-bold font-display mb-2">
            {onboardingMode === "guest" ? "Your Information" : "Create Your Account"}
          </h1>
          <p className="text-muted-foreground mb-8">
            {onboardingMode === "guest"
              ? "We need a few details to complete your consent."
              : "Create an account to save your information for future visits."}
          </p>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  placeholder="Sarah"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="input-focus-ring"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  placeholder="Johnson"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="input-focus-ring"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dob">Date of Birth *</Label>
              <Input
                id="dob"
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className="input-focus-ring"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 input-focus-ring"
                  disabled={onboardingMode === "guest"}
                />
              </div>
            </div>

            {onboardingMode === "account" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+1 (555) 123-4567"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="pl-10 input-focus-ring"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="preferredContact">Preferred Contact Method</Label>
                  <Select value={preferredContact} onValueChange={setPreferredContact}>
                    <SelectTrigger className="input-focus-ring">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="phone">Phone</SelectItem>
                      <SelectItem value="text">Text Message</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="At least 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-focus-ring"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password *</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="input-focus-ring"
                  />
                </div>
              </>
            )}

            <Button
              className="w-full"
              onClick={onboardingMode === "guest" ? handleGuestContinue : handleAccountCreate}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {onboardingMode === "account" ? "Creating Account..." : "Continuing..."}
                </>
              ) : (
                <>Continue to Consent Form</>
              )}
            </Button>
          </div>
        </main>
      </div>
    );
  }

  // Main consent signing view
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Shield className="h-5 w-5" />
            </div>
            <span className="font-display text-xl font-bold">ClearConsent</span>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium">{firstName} {lastName}</p>
            <p className="text-xs text-muted-foreground">{currentDate}</p>
          </div>
        </div>
      </header>

      <main className="container py-8 max-w-3xl">
        <div className="space-y-8 animate-fade-in">
          {/* Provider Info */}
          <div className="card-elevated p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-primary/10">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Consent requested by</p>
                <p className="font-semibold text-lg">
                  {invite?.provider_profiles?.full_name || "Your Provider"}
                </p>
                {invite?.provider_profiles?.practice_name && (
                  <p className="text-sm text-muted-foreground">
                    {invite.provider_profiles.practice_name}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Module Title */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold font-display mb-2">
              {invite?.consent_modules?.name}
            </h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              {currentDate}
            </div>
          </div>

          {/* Educational Video */}
          {invite?.consent_modules?.video_url && (
            <div className="card-elevated p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold flex items-center gap-2">
                  <Video className="h-5 w-5 text-primary" />
                  Educational Video
                </h2>
                {!videoWatched && (
                  <span className="text-xs text-orange-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Required viewing
                  </span>
                )}
              </div>
              <div className="aspect-video rounded-xl overflow-hidden bg-muted">
                <iframe
                  src={invite.consent_modules.video_url}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              <div className="flex items-center gap-3">
                <Checkbox
                  id="videoWatched"
                  checked={videoWatched}
                  onCheckedChange={(checked) => setVideoWatched(checked as boolean)}
                />
                <Label htmlFor="videoWatched" className="text-sm cursor-pointer">
                  I have watched the educational video
                </Label>
              </div>
            </div>
          )}

          {/* Consent Text */}
          <div className="card-elevated p-6 space-y-4">
            <h2 className="font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Consent Agreement
            </h2>
            <div className="max-h-[400px] overflow-y-auto p-4 rounded-xl bg-muted/50 border border-border">
              <p className="whitespace-pre-wrap text-sm leading-relaxed">
                {invite?.consent_modules?.description || "No consent text provided."}
              </p>
            </div>
          </div>

          {/* Agreement Section */}
          <div className="card-elevated p-6 space-y-6">
            <h2 className="font-semibold flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Your Agreement
            </h2>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="materialsReviewed"
                  checked={materialsReviewed}
                  onCheckedChange={(checked) => setMaterialsReviewed(checked as boolean)}
                />
                <Label htmlFor="materialsReviewed" className="text-sm cursor-pointer leading-relaxed">
                  I have reviewed all educational materials and the consent text above. I understand the information provided.
                </Label>
              </div>

              <div className="flex items-start gap-3">
                <Checkbox
                  id="agreementChecked"
                  checked={agreementChecked}
                  onCheckedChange={(checked) => setAgreementChecked(checked as boolean)}
                />
                <Label htmlFor="agreementChecked" className="text-sm cursor-pointer leading-relaxed">
                  I agree to the terms of this consent form. I understand that by typing my name below, I am providing my legal digital signature.
                </Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="signature">Digital Signature (Type your legal full name)</Label>
              <Input
                id="signature"
                placeholder={`e.g., ${firstName} ${lastName}`}
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
                className="text-lg font-medium h-14 input-focus-ring"
              />
            </div>

            <Button
              size="lg"
              className="w-full"
              disabled={!canSubmit || isSubmitting}
              onClick={handleSubmit}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-5 w-5 mr-2" />
                  Submit Signed Consent
                </>
              )}
            </Button>

            {!canSubmit && (
              <p className="text-xs text-center text-muted-foreground">
                Please complete all required fields above to submit your consent.
              </p>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-12">
        <div className="container py-6 text-center">
          <p className="text-xs text-muted-foreground">
            This consent form is secured with encryption. Your information is protected.
          </p>
        </div>
      </footer>
    </div>
  );
}
