import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, ShieldCheck, Smartphone, Trash2, AlertTriangle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type MFAStatus = "loading" | "not_enrolled" | "enrolling" | "enrolled";

export function MFASettings() {
  const [status, setStatus] = useState<MFAStatus>("loading");
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [factorId, setFactorId] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isUnenrolling, setIsUnenrolling] = useState(false);
  const [enrolledFactorId, setEnrolledFactorId] = useState("");

  useEffect(() => {
    checkMFAStatus();
  }, []);

  const checkMFAStatus = async () => {
    setStatus("loading");
    const { data, error } = await supabase.auth.mfa.listFactors();
    if (error) {
      console.error("Error checking MFA status:", error);
      setStatus("not_enrolled");
      return;
    }

    const verifiedFactor = data.totp.find((f) => f.status === "verified");
    if (verifiedFactor) {
      setEnrolledFactorId(verifiedFactor.id);
      setStatus("enrolled");
    } else {
      setStatus("not_enrolled");
    }
  };

  const startEnrollment = async () => {
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: "ClearConsent Authenticator",
    });

    if (error) {
      toast.error("Failed to start MFA enrollment");
      console.error("MFA enroll error:", error);
      return;
    }

    setFactorId(data.id);
    setQrCode(data.totp.qr_code);
    setSecret(data.totp.secret);
    setStatus("enrolling");
  };

  const verifyEnrollment = async () => {
    if (verifyCode.length !== 6) {
      toast.error("Please enter a 6-digit code");
      return;
    }

    setIsVerifying(true);
    const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
      factorId,
    });

    if (challengeError) {
      toast.error("Failed to create MFA challenge");
      setIsVerifying(false);
      return;
    }

    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challengeData.id,
      code: verifyCode,
    });

    if (verifyError) {
      toast.error("Invalid code. Please try again.");
      setVerifyCode("");
      setIsVerifying(false);
      return;
    }

    toast.success("MFA enabled successfully! Your account is now more secure.");
    setVerifyCode("");
    setQrCode("");
    setSecret("");
    setEnrolledFactorId(factorId);
    setStatus("enrolled");
    setIsVerifying(false);
  };

  const unenrollMFA = async () => {
    setIsUnenrolling(true);
    const { error } = await supabase.auth.mfa.unenroll({ factorId: enrolledFactorId });

    if (error) {
      toast.error("Failed to disable MFA");
      console.error("MFA unenroll error:", error);
    } else {
      toast.success("MFA has been disabled");
      setEnrolledFactorId("");
      setStatus("not_enrolled");
    }
    setIsUnenrolling(false);
  };

  if (status === "loading") {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5" />
          Two-Factor Authentication
          {status === "enrolled" && (
            <Badge variant="default" className="ml-2">Enabled</Badge>
          )}
        </CardTitle>
        <CardDescription>
          Add an extra layer of security to your account using an authenticator app
        </CardDescription>
      </CardHeader>
      <CardContent>
        {status === "not_enrolled" && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
              <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
              <div className="text-sm">
                <p className="font-medium">MFA is recommended for HIPAA compliance</p>
                <p className="text-muted-foreground mt-1">
                  Protect patient data by requiring a second factor when signing in. 
                  You'll need an authenticator app like Google Authenticator, Authy, or 1Password.
                </p>
              </div>
            </div>
            <Button onClick={startEnrollment}>
              <Smartphone className="h-4 w-4 mr-2" />
              Set Up Authenticator
            </Button>
          </div>
        )}

        {status === "enrolling" && (
          <div className="space-y-6">
            <div className="space-y-2">
              <p className="text-sm font-medium">1. Scan this QR code with your authenticator app</p>
              <div className="flex justify-center p-4 bg-white rounded-lg border w-fit mx-auto">
                <img src={qrCode} alt="MFA QR Code" className="w-48 h-48" />
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Or enter this secret manually:</p>
              <code className="block p-3 bg-muted rounded-lg text-xs font-mono break-all select-all">
                {secret}
              </code>
            </div>

            <div className="space-y-2">
              <Label htmlFor="totp-code">2. Enter the 6-digit code from your app</Label>
              <div className="flex gap-3">
                <Input
                  id="totp-code"
                  placeholder="000000"
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  onKeyDown={(e) => e.key === "Enter" && verifyEnrollment()}
                  className="max-w-[200px] text-center text-lg tracking-widest font-mono"
                  maxLength={6}
                  autoComplete="one-time-code"
                />
                <Button onClick={verifyEnrollment} disabled={isVerifying || verifyCode.length !== 6}>
                  {isVerifying ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify & Enable"}
                </Button>
              </div>
            </div>

            <Button variant="ghost" size="sm" onClick={() => { setStatus("not_enrolled"); setQrCode(""); setSecret(""); }}>
              Cancel
            </Button>
          </div>
        )}

        {status === "enrolled" && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 rounded-lg bg-primary/5 border border-primary/20">
              <ShieldCheck className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div className="text-sm">
                <p className="font-medium">Two-factor authentication is active</p>
                <p className="text-muted-foreground mt-1">
                  You'll be asked for a code from your authenticator app each time you sign in.
                </p>
              </div>
            </div>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Disable MFA
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Disable Two-Factor Authentication?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will remove the extra security layer from your account. 
                    MFA is strongly recommended for HIPAA compliance when handling patient data.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep MFA Enabled</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={unenrollMFA}
                    disabled={isUnenrolling}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {isUnenrolling ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Disable MFA
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
