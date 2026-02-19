import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useDemoMode } from "@/hooks/useDemoMode";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Shield, CheckCircle2, Play, FileText, AlertTriangle, ArrowRight, ArrowLeft } from "lucide-react";
import { useEffect, useRef } from "react";

const MOCK_PROCEDURE = {
  name: "Knee Arthroscopy",
  description:
    "Knee arthroscopy is a minimally invasive surgical procedure used to diagnose and treat problems in the knee joint. During the procedure, a small camera (arthroscope) is inserted through a tiny incision, allowing the surgeon to view the inside of the joint on a screen.\n\nCommon conditions treated include torn meniscus, damaged cartilage, loose bone fragments, and inflamed synovial tissue. The procedure typically takes 30-60 minutes under general or regional anesthesia.",
  risks: [
    "Infection at incision sites",
    "Blood clots in the leg (deep vein thrombosis)",
    "Damage to nerves or blood vessels",
    "Stiffness or continued pain",
    "Allergic reaction to anesthesia",
  ],
  benefits: [
    "Smaller incisions and less scarring",
    "Faster recovery compared to open surgery",
    "Reduced post-operative pain",
    "Outpatient procedure — go home same day",
  ],
};

type Step = "identity" | "review" | "risks" | "sign";

export default function DemoPatientView() {
  const { profile } = useAuth();
  const { isDemoMode } = useDemoMode();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("identity");
  const [firstName, setFirstName] = useState("Sarah");
  const [lastName, setLastName] = useState("Johnson");
  const [risksAcknowledged, setRisksAcknowledged] = useState<boolean[]>(
    MOCK_PROCEDURE.risks.map(() => false)
  );
  const [signature, setSignature] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const providerName = profile?.full_name || "Dr. Provider";
  const practiceName = profile?.practice_name || "Medical Practice";

  useEffect(() => {
    if (!isDemoMode) navigate("/settings");
  }, [isDemoMode, navigate]);

  const allRisksAcked = risksAcknowledged.every(Boolean);

  // Simple canvas signature
  const startDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setIsDrawing(true);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "hsl(var(--foreground))";
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const endDraw = () => {
    if (isDrawing) {
      setIsDrawing(false);
      setSignature("signed");
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignature("");
  };

  const handleSubmit = () => setSubmitted(true);

  const steps: { key: Step; label: string }[] = [
    { key: "identity", label: "Verify" },
    { key: "review", label: "Review" },
    { key: "risks", label: "Risks" },
    { key: "sign", label: "Sign" },
  ];

  const currentIdx = steps.findIndex((s) => s.key === step);

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-8 pb-8 space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold font-display">Consent Signed!</h2>
            <p className="text-muted-foreground">
              {firstName} {lastName}'s consent for <strong>{MOCK_PROCEDURE.name}</strong> has been recorded.
            </p>
            <Badge variant="outline" className="text-xs">DEMO — No data was saved</Badge>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur sticky top-0 z-40">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <span className="font-display font-bold">ClearConsent</span>
          </div>
          <Badge variant="secondary" className="text-xs">Demo Mode</Badge>
        </div>
      </header>

      {/* Step Indicator */}
      <div className="container max-w-2xl py-4">
        <div className="flex items-center justify-between mb-6">
          {steps.map((s, i) => (
            <div key={s.key} className="flex items-center gap-1">
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  i <= currentIdx
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {i + 1}
              </div>
              <span className="hidden sm:inline text-xs text-muted-foreground">{s.label}</span>
              {i < steps.length - 1 && (
                <div className={`h-px w-6 sm:w-12 ${i < currentIdx ? "bg-primary" : "bg-border"}`} />
              )}
            </div>
          ))}
        </div>

        {/* STEP: Identity */}
        {step === "identity" && (
          <Card>
            <CardHeader>
              <CardTitle>Verify Your Identity</CardTitle>
              <CardDescription>
                {providerName} at {practiceName} has requested your consent for a procedure.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>First Name</Label>
                  <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Last Name</Label>
                  <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
                </div>
              </div>
              <Button className="w-full h-12 text-base" onClick={() => setStep("review")}>
                Continue <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* STEP: Review */}
        {step === "review" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {MOCK_PROCEDURE.name}
              </CardTitle>
              <CardDescription>
                Provided by {providerName} — {practiceName}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="prose prose-sm max-w-none">
                {MOCK_PROCEDURE.description.split("\n\n").map((p, i) => (
                  <p key={i} className="text-muted-foreground leading-relaxed">{p}</p>
                ))}
              </div>

              <Separator />

              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" /> Benefits
                </h4>
                <ul className="space-y-1">
                  {MOCK_PROCEDURE.benefits.map((b, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-primary mt-1">•</span> {b}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep("identity")}>
                  <ArrowLeft className="h-4 w-4 mr-1" /> Back
                </Button>
                <Button className="flex-1 h-12 text-base" onClick={() => setStep("risks")}>
                  Continue to Risks <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* STEP: Risks */}
        {step === "risks" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Risks & Acknowledgments
              </CardTitle>
              <CardDescription>
                Please acknowledge each risk before proceeding to sign.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {MOCK_PROCEDURE.risks.map((risk, i) => (
                <label
                  key={i}
                  className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer transition-colors"
                >
                  <Checkbox
                    checked={risksAcknowledged[i]}
                    onCheckedChange={(checked) => {
                      const updated = [...risksAcknowledged];
                      updated[i] = !!checked;
                      setRisksAcknowledged(updated);
                    }}
                    className="mt-0.5 h-5 w-5"
                  />
                  <span className="text-sm">{risk}</span>
                </label>
              ))}

              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={() => setStep("review")}>
                  <ArrowLeft className="h-4 w-4 mr-1" /> Back
                </Button>
                <Button
                  className="flex-1 h-12 text-base"
                  disabled={!allRisksAcked}
                  onClick={() => setStep("sign")}
                >
                  Continue to Sign <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* STEP: Sign */}
        {step === "sign" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5" />
                Electronic Signature
              </CardTitle>
              <CardDescription>
                Sign below to confirm your consent for {MOCK_PROCEDURE.name}.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                I, <strong>{firstName} {lastName}</strong>, acknowledge that I have reviewed the
                procedure information and risks for <strong>{MOCK_PROCEDURE.name}</strong> and give
                my informed consent.
              </p>

              <div className="space-y-2">
                <Label>Draw your signature</Label>
                <div className="border border-border rounded-lg overflow-hidden bg-muted/30">
                  <canvas
                    ref={canvasRef}
                    width={500}
                    height={150}
                    className="w-full cursor-crosshair touch-none"
                    onMouseDown={startDraw}
                    onMouseMove={draw}
                    onMouseUp={endDraw}
                    onMouseLeave={endDraw}
                    onTouchStart={startDraw}
                    onTouchMove={draw}
                    onTouchEnd={endDraw}
                  />
                </div>
                {signature && (
                  <Button variant="ghost" size="sm" onClick={clearSignature}>
                    Clear signature
                  </Button>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={() => setStep("risks")}>
                  <ArrowLeft className="h-4 w-4 mr-1" /> Back
                </Button>
                <Button
                  className="flex-1 h-12 text-base"
                  disabled={!signature}
                  onClick={handleSubmit}
                >
                  <CheckCircle2 className="h-5 w-5 mr-2" />
                  Submit Signed Consent
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Bottom spacer for demo toolbar */}
        <div className="h-20" />
      </div>
    </div>
  );
}
