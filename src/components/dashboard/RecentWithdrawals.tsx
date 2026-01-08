import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertTriangle,
  Loader2,
  User,
  FileText,
  Calendar,
  MessageSquare,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format, formatDistanceToNow } from "date-fns";

interface WithdrawalWithDetails {
  id: string;
  withdrawn_at: string;
  reason: string | null;
  consent_submissions: {
    id: string;
    patient_first_name: string;
    patient_last_name: string;
    patient_email: string;
    signed_at: string;
    consent_modules: {
      name: string;
    } | null;
  } | null;
}

const DISMISSAL_KEY = "recentWithdrawals_dismissed";

export function RecentWithdrawals() {
  const { user } = useAuth();
  const [withdrawals, setWithdrawals] = useState<WithdrawalWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<WithdrawalWithDetails | null>(null);
  const [isDismissed, setIsDismissed] = useState(() => {
    return localStorage.getItem(DISMISSAL_KEY) === "true";
  });

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem(DISMISSAL_KEY, "true");
  };

  useEffect(() => {
    if (user) {
      fetchWithdrawals();
    }
  }, [user]);

  const fetchWithdrawals = async () => {
    if (!user) return;

    setIsLoading(true);
    const { data, error } = await supabase
      .from("consent_withdrawals")
      .select(`
        id,
        withdrawn_at,
        reason,
        consent_submissions!inner (
          id,
          patient_first_name,
          patient_last_name,
          patient_email,
          signed_at,
          provider_id,
          consent_modules (
            name
          )
        )
      `)
      .eq("consent_submissions.provider_id", user.id)
      .order("withdrawn_at", { ascending: false })
      .limit(5);

    if (error) {
      console.error("Error fetching withdrawals:", error);
    } else {
      setWithdrawals((data as unknown as WithdrawalWithDetails[]) || []);
    }
    setIsLoading(false);
  };

  const formatPatientName = (firstName: string, lastName: string) => {
    return `${firstName || ""} ${lastName || ""}`.trim() || "Unknown";
  };

  if (isLoading) {
    return (
      <div className="card-elevated">
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <h3 className="font-semibold text-sm">Recent Withdrawals</h3>
          </div>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (isDismissed) {
    return null;
  }

  return (
    <>
      <div className="card-elevated">
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <h3 className="font-semibold text-sm">Recent Withdrawals</h3>
            </div>
            <div className="flex items-center gap-2">
              {withdrawals.length > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {withdrawals.length}
                </Badge>
              )}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={handleDismiss}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Dismiss</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>

        {withdrawals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center px-4">
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center mb-3">
              <AlertTriangle className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">No withdrawals</p>
            <p className="text-xs text-muted-foreground mt-1">
              Consent withdrawals will appear here
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {withdrawals.map((withdrawal) => {
              const submission = withdrawal.consent_submissions;
              if (!submission) return null;

              const patientName = formatPatientName(
                submission.patient_first_name,
                submission.patient_last_name
              );
              const timeAgo = formatDistanceToNow(new Date(withdrawal.withdrawn_at), {
                addSuffix: true,
              });

              return (
                <button
                  key={withdrawal.id}
                  onClick={() => setSelectedWithdrawal(withdrawal)}
                  className="w-full p-4 text-left hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4 text-destructive" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{patientName}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {submission.consent_modules?.name || "Unknown Module"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">{timeAgo}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Withdrawal Details Dialog */}
      <Dialog open={!!selectedWithdrawal} onOpenChange={() => setSelectedWithdrawal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Consent Withdrawal
            </DialogTitle>
            <DialogDescription>
              A patient has withdrawn their consent
            </DialogDescription>
          </DialogHeader>

          {selectedWithdrawal?.consent_submissions && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                <User className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">
                    {formatPatientName(
                      selectedWithdrawal.consent_submissions.patient_first_name,
                      selectedWithdrawal.consent_submissions.patient_last_name
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {selectedWithdrawal.consent_submissions.patient_email}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">
                    {selectedWithdrawal.consent_submissions.consent_modules?.name || "Unknown"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Originally signed{" "}
                    {format(
                      new Date(selectedWithdrawal.consent_submissions.signed_at),
                      "MMM d, yyyy"
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Withdrawn</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(selectedWithdrawal.withdrawn_at), "MMMM d, yyyy 'at' h:mm a")}
                  </p>
                </div>
              </div>

              {selectedWithdrawal.reason && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                  <div className="flex items-start gap-2">
                    <MessageSquare className="h-4 w-4 text-destructive mt-0.5" />
                    <div>
                      <p className="font-medium text-sm text-destructive">Reason provided</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {selectedWithdrawal.reason}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setSelectedWithdrawal(null)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
