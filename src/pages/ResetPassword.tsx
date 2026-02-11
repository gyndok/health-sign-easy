import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Lock, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});
  const [hasSession, setHasSession] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if user arrived via a valid recovery link
    supabase.auth.getSession().then(({ data: { session } }) => {
      setHasSession(!!session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setHasSession(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const validatePassword = (pw: string) => {
    if (!pw) return "Password is required";
    if (pw.length < 12) return "Must be at least 12 characters";
    if (!/[A-Z]/.test(pw)) return "Must contain an uppercase letter";
    if (!/[a-z]/.test(pw)) return "Must contain a lowercase letter";
    if (!/[0-9]/.test(pw)) return "Must contain a number";
    if (!/[^A-Za-z0-9]/.test(pw)) return "Must contain a special character";
    return undefined;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const pwError = validatePassword(password);
    const confirmError = password !== confirmPassword ? "Passwords do not match" : undefined;
    setErrors({ password: pwError, confirm: confirmError });

    if (pwError || confirmError) return;

    setIsLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setIsLoading(false);

    if (error) {
      toast.error(error.message);
    } else {
      setSuccess(true);
      setTimeout(() => navigate("/auth"), 3000);
    }
  };

  if (hasSession === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!hasSession) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center space-y-4 max-w-md">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
          <h2 className="text-2xl font-bold font-display">Invalid or Expired Link</h2>
          <p className="text-muted-foreground">
            This password reset link is invalid or has expired. Please request a new one.
          </p>
          <Button asChild>
            <Link to="/forgot-password">Request New Link</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#grid)" />
          </svg>
        </div>
        <div className="relative z-10 flex flex-col justify-center px-12 lg:px-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur">
              <Shield className="h-7 w-7 text-white" />
            </div>
            <span className="font-display text-3xl font-bold text-white">ClearConsent</span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold text-white leading-tight mb-6">
            Set Your<br />New Password
          </h1>
          <p className="text-lg text-white/80 max-w-md">
            Choose a strong password to keep your account secure.
          </p>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-12">
        <div className="mx-auto w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Shield className="h-6 w-6" />
            </div>
            <span className="font-display text-2xl font-bold">ClearConsent</span>
          </div>

          {success ? (
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-success/10 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-success" />
              </div>
              <h2 className="text-2xl font-bold font-display">Password Updated</h2>
              <p className="text-muted-foreground">
                Your password has been reset successfully. Redirecting you to sign in...
              </p>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h2 className="text-2xl font-bold font-display">Set new password</h2>
                <p className="text-muted-foreground mt-2">
                  Your new password must be at least 12 characters with uppercase, lowercase, number, and special character.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="password">New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`pl-10 input-focus-ring ${errors.password ? "border-destructive" : ""}`}
                    />
                  </div>
                  {errors.password && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.password}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`pl-10 input-focus-ring ${errors.confirm ? "border-destructive" : ""}`}
                    />
                  </div>
                  {errors.confirm && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.confirm}
                    </p>
                  )}
                </div>

                <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Reset Password"
                  )}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
