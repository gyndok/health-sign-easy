import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Shield, 
  Video, 
  FileText, 
  CheckCircle2,
  AlertCircle,
  Loader2,
  UserPlus,
  UserCheck,
  LogIn,
  Lock,
  Mail,
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
  module_id: string;
  module_name: string;
  module_description: string | null;
  module_video_url: string | null;
  provider_full_name: string | null;
  provider_practice_name: string | null;
}

type OnboardingMode = "choice" | "guest" | "account" | "login" | "complete";

export default function ConsentSigning() {
  const { token } = useParams();
  
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
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  
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
    
    // Use the secure RPC function to fetch invite by token
    const { data, error: fetchError } = await supabase
      .rpc("get_invite_by_token", { p_token: token });

    if (fetchError) {
      console.error("Error fetching invite:", fetchError);
      setError("Failed to load consent form");
      setIsLoading(false);
      return;
    }

    if (!data || data.length === 0) {
      setError("This consent link is invalid or has expired");
      setIsLoading(false);
      return;
    }

    const inviteData = data[0] as InviteData;

    // Check if expired
    if (new Date(inviteData.expires_at) < new Date()) {
      setError("This consent link has expired. Please request a new one from your provider.");
      setIsLoading(false);
      return;
    }

    // Check if already completed
    if (inviteData.status === "completed") {
      setError("This consent form has already been signed.");
      setIsLoading(false);
      return;
    }

    setInvite(inviteData);
    setEmail(inviteData.patient_email);
    
    // If patient info already exists, skip to consent
    if (inviteData.patient_first_name && inviteData.patient_last_name) {
      setFirstName(inviteData.patient_first_name);
      setLastName(inviteData.patient_last_name);
      setOnboardingMode("complete");
    }

    // Update status to viewed if pending
    if (inviteData.status === "pending") {
      await supabase.rpc("mark_invite_viewed", { p_token: token });
    }

    setIsLoading(false);
  };

  const validateName = (name: string) => name.trim().length >= 2;
  const validateDOB = (dob: string) => {
    if (!dob) return false;
    const date = new Date(dob);
    const now = new Date();
    return date < now && date.getFullYear() > 1900;
  };

  const handleGuestContinue = async () => {
    if (!validateName(firstName)) {
      toast.error("Please enter a valid first name");
      return;
    }
    if (!validateName(lastName)) {
      toast.error("Please enter a valid last name");
      return;
    }
    if (!validateDOB(dateOfBirth)) {
      toast.error("Please enter a valid date of birth");
      return;
    }

    setIsSubmitting(true);

    // Update invite with patient info using RPC
    const { error } = await supabase.rpc("update_invite_patient_info_by_token", {
      p_token: token,
      p_first_name: firstName.trim(),
      p_last_name: lastName.trim(),
    });

    if (error) {
      console.error("Error updating invite:", error);
      toast.error("Failed to save your information");
      setIsSubmitting(false);
      return;
    }

    setOnboardingMode("complete");
    setIsSubmitting(false);
  };

  const handleAccountCreate = async () => {
    if (!validateName(firstName)) {
      toast.error("Please enter a valid first name");
      return;
    }
    if (!validateName(lastName)) {
      toast.error("Please enter a valid last name");
      return;
    }
    if (!validateDOB(dateOfBirth)) {
      toast.error("Please enter a valid date of birth");
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

    // Link patient user to invite using RPC
    if (authData.user) {
      await supabase.rpc("link_invite_patient_user_by_token", {
        p_token: token,
        p_first_name: firstName.trim(),
        p_last_name: lastName.trim(),
      });
    }

    toast.success("Account created! You can now sign the consent.");
    setOnboardingMode("complete");
    setIsSubmitting(false);
  };

  const handleLogin = async () => {
    if (!loginEmail.trim() || !loginPassword) {
      toast.error("Please enter your email and password");
      return;
    }

    setIsSubmitting(true);

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: loginEmail.trim(),
      password: loginPassword,
    });

    if (authError) {
      console.error("Error signing in:", authError);
      if (authError.message.includes("Invalid login credentials")) {
        toast.error("Invalid email or password");
      } else {
        toast.error(authError.message);
      }
      setIsSubmitting(false);
      return;
    }

    // Link patient user to invite and get their name
    if (authData.user) {
      // Get patient profile for name
      const { data: patientProfile } = await supabase
        .from("patient_profiles")
        .select("first_name, last_name")
        .eq("user_id", authData.user.id)
        .maybeSingle();

      if (patientProfile) {
        setFirstName(patientProfile.first_name);
        setLastName(patientProfile.last_name);
      }

      // Link invite to user
      await supabase.rpc("link_invite_patient_user_by_token", {
        p_token: token,
        p_first_name: patientProfile?.first_name || "",
        p_last_name: patientProfile?.last_name || "",
      });
    }

    toast.success("Signed in successfully!");
    setOnboardingMode("complete");
    setIsSubmitting(false);
  };

  const handleSubmit = async () => {
    if (!canSubmit || !invite || !token) return;

    setIsSubmitting(true);

    // Submit consent using secure RPC
    const { data: submissionId, error } = await supabase.rpc("submit_consent_by_token", {
      p_token: token,
      p_patient_first_name: firstName,
      p_patient_last_name: lastName,
      p_signature: signature.trim(),
    });

    if (error) {
      console.error("Error submitting consent:", error);
      toast.error("Failed to submit consent. Please try again.");
      setIsSubmitting(false);
      return;
    }

    // Generate PDF in background (don't wait for it)
    if (submissionId) {
      supabase.functions.invoke("generate-consent-pdf", {
        body: { submissionId },
      }).then(({ error: pdfError }) => {
        if (pdfError) {
          console.error("Error generating PDF:", pdfError);
        } else {
          console.log("PDF generated successfully");
        }
      });
    }

    setIsComplete(true);
    toast.success("Consent submitted successfully!");
    setIsSubmitting(false);
  };

  const canSubmit = 
    (invite?.module_video_url ? videoWatched : true) && 
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
              <span className="font-medium">{invite?.module_name}</span>
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
              <strong>{invite?.provider_full_name || "your provider"}</strong>
              {invite?.provider_practice_name && (
                <> from <strong>{invite.provider_practice_name}</strong></>
              )}
            </p>
          </div>

          {invite?.custom_message && (
            <div className="card-elevated p-4 mb-8 bg-primary/5 border-primary/20">
              <p className="text-sm italic">"{invite.custom_message}"</p>
              <p className="text-xs text-muted-foreground mt-2">
                — {invite.provider_full_name}
              </p>
            </div>
          )}

          <div className="card-elevated p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="h-5 w-5 text-primary" />
              <h2 className="font-semibold">{invite?.module_name}</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Before signing, we need a few details from you.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <button
              onClick={() => setOnboardingMode("guest")}
              className="card-interactive p-5 text-left hover:border-primary transition-colors"
            >
              <UserCheck className="h-7 w-7 text-primary mb-3" />
              <h3 className="font-semibold mb-1.5 text-sm">Continue as Guest</h3>
              <p className="text-xs text-muted-foreground">
                Quick and easy, no account needed.
              </p>
            </button>

            <button
              onClick={() => {
                setLoginEmail(invite?.patient_email || "");
                setOnboardingMode("login");
              }}
              className="card-interactive p-5 text-left hover:border-primary transition-colors"
            >
              <LogIn className="h-7 w-7 text-primary mb-3" />
              <h3 className="font-semibold mb-1.5 text-sm">Sign In</h3>
              <p className="text-xs text-muted-foreground">
                Already have an account? Sign in here.
              </p>
            </button>

            <button
              onClick={() => setOnboardingMode("account")}
              className="card-interactive p-5 text-left hover:border-primary transition-colors"
            >
              <UserPlus className="h-7 w-7 text-primary mb-3" />
              <h3 className="font-semibold mb-1.5 text-sm">Create Account</h3>
              <p className="text-xs text-muted-foreground">
                Save your info for future visits.
              </p>
            </button>
          </div>
        </main>
      </div>
    );
  }

  // Onboarding: Login form
  if (onboardingMode === "login") {
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

        <main className="container py-6 sm:py-8 px-4 sm:px-6 max-w-md">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setOnboardingMode("choice")}
            className="mb-6"
          >
            ← Back
          </Button>

          <h1 className="text-2xl font-bold font-display mb-2">
            Sign In to Your Account
          </h1>
          <p className="text-muted-foreground mb-8">
            Sign in to link this consent to your patient profile.
          </p>

          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="loginEmail">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="loginEmail"
                  type="email"
                  placeholder="your@email.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="input-focus-ring pl-10 text-base"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="loginPassword">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="loginPassword"
                  type="password"
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="input-focus-ring pl-10 text-base"
                />
              </div>
            </div>

            <Button
              onClick={handleLogin}
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Signing In...
                </>
              ) : (
                "Sign In & Continue"
              )}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <button
                type="button"
                onClick={() => setOnboardingMode("account")}
                className="text-primary font-medium hover:underline"
              >
                Create one
              </button>
            </p>
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

        <main className="container py-6 sm:py-8 px-4 sm:px-6 max-w-lg">
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

          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  placeholder="Sarah"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="input-focus-ring text-base"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  placeholder="Johnson"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="input-focus-ring text-base"
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
                className="input-focus-ring text-base"
                max={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  value={email}
                  disabled
                  className="bg-muted"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                This is the email address your provider used to send you this invitation.
              </p>
            </div>

            {onboardingMode === "account" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number (Optional)</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="(555) 123-4567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="input-focus-ring"
                  />
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
              onClick={onboardingMode === "guest" ? handleGuestContinue : handleAccountCreate}
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {onboardingMode === "guest" ? "Saving..." : "Creating Account..."}
                </>
              ) : (
                onboardingMode === "guest" ? "Continue to Consent" : "Create Account & Continue"
              )}
            </Button>
          </div>
        </main>
      </div>
    );
  }

  // Main consent signing form
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

      <main className="container py-6 sm:py-8 px-4 sm:px-6 max-w-3xl">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold font-display mb-2">
            {invite?.module_name}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Please review the information below and provide your signature.
          </p>
        </div>

        <div className="space-y-4 sm:space-y-6">
        {/* Video Section */}
          {invite?.module_video_url && (
            <div className="card-elevated p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-4">
                <Video className="h-5 w-5 text-primary" />
                <h2 className="font-semibold">Educational Video</h2>
              </div>
              <div className="aspect-video bg-muted rounded-lg overflow-hidden mb-4">
                {(() => {
                  const url = invite.module_video_url;
                  // Check if it's a YouTube URL
                  const youtubeMatch = url.match(
                    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
                  );
                  if (youtubeMatch) {
                    const videoId = youtubeMatch[1];
                    return (
                      <iframe
                        src={`https://www.youtube.com/embed/${videoId}`}
                        title="Educational Video"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="w-full h-full"
                      />
                    );
                  }
                  // Check if it's a Vimeo URL
                  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
                  if (vimeoMatch) {
                    const videoId = vimeoMatch[1];
                    return (
                      <iframe
                        src={`https://player.vimeo.com/video/${videoId}`}
                        title="Educational Video"
                        allow="autoplay; fullscreen; picture-in-picture"
                        allowFullScreen
                        className="w-full h-full"
                      />
                    );
                  }
                  // Default to native video player for direct video URLs
                  return (
                    <video
                      src={url}
                      controls
                      className="w-full h-full"
                      onEnded={() => setVideoWatched(true)}
                    />
                  );
                })()}
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="videoWatched"
                  checked={videoWatched}
                  onCheckedChange={(checked) => setVideoWatched(checked === true)}
                />
                <Label htmlFor="videoWatched" className="text-sm cursor-pointer">
                  I have watched and understood the educational video
                </Label>
              </div>
            </div>
          )}

          {/* Description Section */}
          {invite?.module_description && (
            <div className="card-elevated p-4 sm:p-6">
              <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                <FileText className="h-5 w-5 text-primary" />
                <h2 className="font-semibold">Consent Information</h2>
              </div>
              <div className="max-h-96 overflow-y-auto pr-2">
                <div className="space-y-4 text-sm leading-relaxed text-foreground/80">
                  {invite.module_description.split('\n').map((paragraph, index) => (
                    paragraph.trim() && (
                      <p key={index} className="text-justify">
                        {paragraph}
                      </p>
                    )
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Acknowledgment Section */}
          <div className="card-elevated p-4 sm:p-6">
            <h2 className="font-semibold mb-4">Acknowledgment</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="materialsReviewed"
                  checked={materialsReviewed}
                  onCheckedChange={(checked) => setMaterialsReviewed(checked === true)}
                />
                <Label htmlFor="materialsReviewed" className="text-sm cursor-pointer leading-relaxed">
                  I have reviewed all the consent materials and understand the information provided.
                </Label>
              </div>
              <div className="flex items-start gap-3">
                <Checkbox
                  id="agreementChecked"
                  checked={agreementChecked}
                  onCheckedChange={(checked) => setAgreementChecked(checked === true)}
                />
                <Label htmlFor="agreementChecked" className="text-sm cursor-pointer leading-relaxed">
                  I voluntarily agree to the procedure/treatment described and understand the risks, benefits, and alternatives.
                </Label>
              </div>
            </div>
          </div>

          {/* Signature Section */}
          <div className="card-elevated p-4 sm:p-6">
            <h2 className="font-semibold mb-4">Digital Signature</h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signature" className="text-sm sm:text-base">Type your full legal name as your signature</Label>
                <Input
                  id="signature"
                  placeholder="e.g., Sarah Johnson"
                  value={signature}
                  onChange={(e) => setSignature(e.target.value)}
                  className="input-focus-ring text-base sm:text-lg"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                By typing your name above, you acknowledge that this constitutes a legal signature.
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || isSubmitting}
            size="lg"
            className="w-full"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Submit Signed Consent
              </>
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Date: {currentDate}
          </p>
        </div>
      </main>
    </div>
  );
}