import { useState } from "react";
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
  Building2,
  User,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";

// This would come from the URL token lookup
const mockConsentData = {
  providerName: "Dr. Jane Roberts",
  practiceName: "City Orthopedic Center",
  moduleName: "Surgical Consent - Knee Replacement",
  moduleDescription: `CONSENT FOR SURGICAL PROCEDURE

I, the undersigned patient, hereby consent to the following surgical procedure: Total Knee Arthroplasty (Knee Replacement Surgery).

NATURE OF THE PROCEDURE:
Total knee arthroplasty is a surgical procedure in which diseased cartilage and bone of the knee joint is surgically replaced with artificial materials. The surgery typically takes 1-2 hours and is performed under general or regional anesthesia.

RISKS AND COMPLICATIONS:
I understand that no surgery is without risk. Potential complications include but are not limited to:
• Blood clots in the legs or lungs
• Infection requiring additional treatment
• Nerve or blood vessel damage
• Stiffness or limited range of motion
• Implant loosening or failure over time
• Need for additional surgeries

BENEFITS:
The expected benefits include pain relief, improved mobility, and enhanced quality of life. However, results may vary.

ALTERNATIVES:
I have been informed of alternative treatments including medication, physical therapy, injections, and continued observation.

I have had the opportunity to ask questions and all of my questions have been answered to my satisfaction. I understand that I may withdraw this consent at any time prior to the procedure.`,
  videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
  patientFirstName: "Sarah",
  patientLastName: "Johnson",
  consentDate: new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }),
};

export default function ConsentSigning() {
  const [videoWatched, setVideoWatched] = useState(false);
  const [materialsReviewed, setMaterialsReviewed] = useState(false);
  const [agreementChecked, setAgreementChecked] = useState(false);
  const [signature, setSignature] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const canSubmit = 
    videoWatched && 
    materialsReviewed && 
    agreementChecked && 
    signature.trim().length > 0;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsComplete(true);
    toast.success("Consent submitted successfully!");
    setIsSubmitting(false);
  };

  if (isComplete) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center animate-scale-in">
          <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="h-10 w-10 text-success" />
          </div>
          <h1 className="text-2xl font-bold font-display mb-3">
            Consent Submitted Successfully
          </h1>
          <p className="text-muted-foreground mb-6">
            Thank you, {mockConsentData.patientFirstName}. Your signed consent has been securely recorded and a PDF copy has been generated.
          </p>
          <div className="p-4 rounded-xl bg-muted text-left">
            <div className="flex items-center gap-2 text-sm mb-2">
              <FileText className="h-4 w-4 text-primary" />
              <span className="font-medium">{mockConsentData.moduleName}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Signed on {mockConsentData.consentDate} by {signature}
            </p>
          </div>
          <p className="text-sm text-muted-foreground mt-6">
            You may close this window. A confirmation email will be sent to you.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Shield className="h-5 w-5" />
            </div>
            <span className="font-display text-xl font-bold">ConsentFlow</span>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium">{mockConsentData.patientFirstName} {mockConsentData.patientLastName}</p>
            <p className="text-xs text-muted-foreground">{mockConsentData.consentDate}</p>
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
                <p className="font-semibold text-lg">{mockConsentData.providerName}</p>
                <p className="text-sm text-muted-foreground">{mockConsentData.practiceName}</p>
              </div>
            </div>
          </div>

          {/* Module Title */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold font-display mb-2">
              {mockConsentData.moduleName}
            </h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              {mockConsentData.consentDate}
            </div>
          </div>

          {/* Educational Video */}
          {mockConsentData.videoUrl && (
            <div className="card-elevated p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold flex items-center gap-2">
                  <Video className="h-5 w-5 text-primary" />
                  Educational Video
                </h2>
                {!videoWatched && (
                  <span className="text-xs text-warning flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Required viewing
                  </span>
                )}
              </div>
              <div className="aspect-video rounded-xl overflow-hidden bg-muted">
                <iframe
                  src={mockConsentData.videoUrl}
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
                {mockConsentData.moduleDescription}
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
                placeholder="e.g., Sarah Marie Johnson"
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
                className="text-lg font-medium h-14 input-focus-ring"
              />
            </div>

            <Button
              size="xl"
              className="w-full"
              disabled={!canSubmit || isSubmitting}
              onClick={handleSubmit}
            >
              {isSubmitting ? (
                "Submitting..."
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
            This consent form is secured with end-to-end encryption. Your information is protected in accordance with HIPAA regulations.
          </p>
        </div>
      </footer>
    </div>
  );
}
