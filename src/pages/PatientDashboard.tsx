import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Shield,
  FileText,
  Download,
  Video,
  AlertTriangle,
  Loader2,
  LogOut,
  CheckCircle2,
  XCircle,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface ConsentSubmission {
  id: string;
  signed_at: string;
  pdf_url: string | null;
  patient_first_name: string;
  patient_last_name: string;
  consent_modules: {
    id: string;
    name: string;
    description: string | null;
    video_url: string | null;
  } | null;
  consent_withdrawals: Array<{
    id: string;
    withdrawn_at: string;
    reason: string | null;
  }> | null;
}

export default function PatientDashboard() {
  const { user, isLoading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState<ConsentSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<ConsentSubmission | null>(null);
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
  const [withdrawReason, setWithdrawReason] = useState("");
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [viewMaterialsOpen, setViewMaterialsOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchSubmissions();
    }
  }, [user]);

  const fetchSubmissions = async () => {
    if (!user) return;

    setIsLoading(true);
    const { data, error } = await supabase
      .from("consent_submissions")
      .select(`
        id,
        signed_at,
        pdf_url,
        patient_first_name,
        patient_last_name,
        consent_modules (
          id,
          name,
          description,
          video_url
        ),
        consent_withdrawals (
          id,
          withdrawn_at,
          reason
        )
      `)
      .order("signed_at", { ascending: false });

    if (error) {
      console.error("Error fetching submissions:", error);
      toast.error("Failed to load your consent forms");
    } else {
      // Type assertion to handle Supabase's nested relationship types
      setSubmissions((data || []) as unknown as ConsentSubmission[]);
    }
    setIsLoading(false);
  };

  const handleDownloadPdf = async (submission: ConsentSubmission) => {
    if (!submission.pdf_url) {
      toast.error("PDF not available yet");
      return;
    }

    try {
      // The pdf_url is a signed URL, so fetch it directly
      const response = await fetch(submission.pdf_url);
      if (!response.ok) throw new Error("Failed to fetch PDF");
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `consent-${submission.patient_last_name}-${format(new Date(submission.signed_at), "yyyy-MM-dd")}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading PDF:", error);
      toast.error("Failed to download PDF");
    }
  };

  const handleWithdrawConsent = async () => {
    if (!selectedSubmission || !user) return;

    setIsWithdrawing(true);

    const { error } = await supabase.from("consent_withdrawals").insert({
      submission_id: selectedSubmission.id,
      patient_user_id: user.id,
      reason: withdrawReason.trim() || null,
    });

    if (error) {
      console.error("Error withdrawing consent:", error);
      if (error.code === "23505") {
        toast.error("You have already withdrawn this consent");
      } else {
        toast.error("Failed to withdraw consent");
      }
    } else {
      toast.success("Consent withdrawal submitted");
      fetchSubmissions();
    }

    setIsWithdrawing(false);
    setWithdrawDialogOpen(false);
    setWithdrawReason("");
    setSelectedSubmission(null);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const isWithdrawn = (submission: ConsentSubmission) => 
    submission.consent_withdrawals && submission.consent_withdrawals.length > 0;

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
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
            <span className="font-display text-xl font-bold">ClearConsent</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate("/patient-settings")}>
              Settings
            </Button>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold font-display mb-2">
            My Consent Forms
          </h1>
          <p className="text-muted-foreground">
            View and manage your signed consent forms
          </p>
        </div>

        {submissions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Consent Forms</h3>
              <p className="text-muted-foreground">
                You haven't signed any consent forms yet.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {submissions.map((submission) => (
              <Card key={submission.id} className={isWithdrawn(submission) ? "opacity-60" : ""}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        {submission.consent_modules?.name || "Consent Form"}
                        {isWithdrawn(submission) ? (
                          <Badge variant="destructive" className="text-xs">
                            <XCircle className="h-3 w-3 mr-1" />
                            Withdrawn
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs bg-green-500/10 text-green-600">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription>
                        Signed on {format(new Date(submission.signed_at), "MMMM d, yyyy 'at' h:mm a")}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {isWithdrawn(submission) && (
                    <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                      <p className="text-sm text-destructive font-medium">
                        Consent withdrawn on{" "}
                        {format(new Date(submission.consent_withdrawals[0].withdrawn_at), "MMMM d, yyyy")}
                      </p>
                      {submission.consent_withdrawals[0].reason && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Reason: {submission.consent_withdrawals[0].reason}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {submission.consent_modules?.video_url && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedSubmission(submission);
                          setViewMaterialsOpen(true);
                        }}
                      >
                        <Video className="h-4 w-4 mr-2" />
                        View Materials
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadPdf(submission)}
                      disabled={!submission.pdf_url}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download PDF
                    </Button>

                    {!isWithdrawn(submission) && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => {
                          setSelectedSubmission(submission);
                          setWithdrawDialogOpen(true);
                        }}
                      >
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        Withdraw Consent
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* View Materials Dialog */}
      <Dialog open={viewMaterialsOpen} onOpenChange={setViewMaterialsOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>{selectedSubmission?.consent_modules?.name}</DialogTitle>
            <DialogDescription>
              Review the educational materials for this consent
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4">
            {selectedSubmission?.consent_modules?.video_url && (
              <div className="aspect-video bg-muted rounded-lg overflow-hidden flex-shrink-0">
                {(() => {
                  const url = selectedSubmission.consent_modules.video_url;
                  const youtubeMatch = url.match(
                    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
                  );
                  if (youtubeMatch) {
                    return (
                      <iframe
                        src={`https://www.youtube.com/embed/${youtubeMatch[1]}`}
                        title="Educational Video"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="w-full h-full"
                      />
                    );
                  }
                  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
                  if (vimeoMatch) {
                    return (
                      <iframe
                        src={`https://player.vimeo.com/video/${vimeoMatch[1]}`}
                        title="Educational Video"
                        allow="autoplay; fullscreen; picture-in-picture"
                        allowFullScreen
                        className="w-full h-full"
                      />
                    );
                  }
                  return <video src={url} controls className="w-full h-full" />;
                })()}
              </div>
            )}

            {selectedSubmission?.consent_modules?.description && (
              <div className="p-4 rounded-lg bg-muted">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Consent Information
                </h4>
                <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {selectedSubmission.consent_modules.description}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Withdraw Consent Dialog */}
      <Dialog open={withdrawDialogOpen} onOpenChange={setWithdrawDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Withdraw Consent
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to withdraw your consent for{" "}
              <strong>{selectedSubmission?.consent_modules?.name}</strong>?
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 mb-4">
              <p className="text-sm text-destructive">
                <strong>Important:</strong> Withdrawing consent is a formal request that will be
                recorded and sent to your healthcare provider. This does not automatically cancel
                any scheduled procedures.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="withdrawReason">Reason (Optional)</Label>
              <Textarea
                id="withdrawReason"
                placeholder="Please share why you're withdrawing consent..."
                value={withdrawReason}
                onChange={(e) => setWithdrawReason(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setWithdrawDialogOpen(false);
                setWithdrawReason("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleWithdrawConsent}
              disabled={isWithdrawing}
            >
              {isWithdrawing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Confirm Withdrawal"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}