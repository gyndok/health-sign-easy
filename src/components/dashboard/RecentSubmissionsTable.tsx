import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  Download, 
  ExternalLink,
  MoreHorizontal,
  Eye,
  Loader2,
  XCircle
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";

type ConsentWithdrawal = {
  id: string;
  withdrawn_at: string;
  reason: string | null;
};

interface SubmissionWithModule {
  id: string;
  patient_first_name: string;
  patient_last_name: string;
  patient_email: string;
  signed_at: string;
  pdf_url: string | null;
  consent_modules: {
    name: string;
  } | null;
  // PostgREST returns an object for 1:1 relationships, but some queries/tools may return arrays.
  consent_withdrawals: ConsentWithdrawal | ConsentWithdrawal[] | null;
}

interface RecentSubmissionsTableProps {
  searchQuery?: string;
}

export function RecentSubmissionsTable({ searchQuery = "" }: RecentSubmissionsTableProps) {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<SubmissionWithModule[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
        patient_first_name,
        patient_last_name,
        patient_email,
        signed_at,
        pdf_url,
        consent_modules (
          name
        ),
        consent_withdrawals (
          id,
          withdrawn_at,
          reason
        )
      `)
      .eq("provider_id", user.id)
      .order("signed_at", { ascending: false })
      .limit(10);

    if (error) {
      console.error("Error fetching submissions:", error);
    } else {
      setSubmissions((data as unknown as SubmissionWithModule[]) || []);
    }
    setIsLoading(false);
  };

  const handleDownloadPdf = async (pdfUrl: string, patientName: string) => {
    try {
      // The pdf_url is a signed URL, so fetch it directly
      const response = await fetch(pdfUrl);
      if (!response.ok) throw new Error("Failed to fetch PDF");
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `consent-${patientName.replace(/\s+/g, "-")}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed:", err);
    }
  };

  const handleViewPdf = async (pdfUrl: string) => {
    // The pdf_url is already a signed URL, so open it directly
    window.open(pdfUrl, "_blank");
  };

  const formatPatientName = (firstName: string, lastName: string) => {
    return `${firstName || ""} ${lastName || ""}`.trim() || "Unknown";
  };

  const getWithdrawal = (submission: SubmissionWithModule): ConsentWithdrawal | null => {
    const w = submission.consent_withdrawals;
    if (!w) return null;
    return Array.isArray(w) ? w[0] ?? null : w;
  };

  const isWithdrawn = (submission: SubmissionWithModule) => !!getWithdrawal(submission);

  const filteredSubmissions = submissions.filter((submission) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const fullName = `${submission.patient_first_name} ${submission.patient_last_name}`.toLowerCase();
    return (
      fullName.includes(query) ||
      submission.patient_email.toLowerCase().includes(query)
    );
  });

  if (isLoading) {
    return (
      <div className="card-elevated overflow-hidden">
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold font-display">Recent Consent Submissions</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Track patient consent status and download signed documents
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="card-elevated overflow-hidden">
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold font-display">Recent Consent Submissions</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Track patient consent status and download signed documents
            </p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link to="/submissions">
              View All
              <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
            </Link>
          </Button>
        </div>
      </div>
      
      {filteredSubmissions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <FileText className="h-10 w-10 text-muted-foreground/50 mb-3" />
          <p className="text-sm text-muted-foreground">
            {searchQuery ? "No matching patients found" : "No consent submissions yet"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {searchQuery ? "Try a different search term" : "Submissions will appear here once patients sign their consent forms"}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3">
                  Patient
                </th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3">
                  Consent Module
                </th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3">
                  Signed Date
                </th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3">
                  Status
                </th>
                <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredSubmissions.map((submission, index) => {
                const patientName = formatPatientName(
                  submission.patient_first_name,
                  submission.patient_last_name
                );
                const signedDate = format(new Date(submission.signed_at), "MMM d, yyyy h:mm a");
                const withdrawal = getWithdrawal(submission);
                const withdrawn = isWithdrawn(submission);
                
                return (
                  <tr 
                    key={submission.id} 
                    className={`hover:bg-muted/30 transition-colors animate-fade-in ${withdrawn ? "bg-destructive/5" : ""}`}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-sm">{patientName}</p>
                        <p className="text-xs text-muted-foreground">{submission.patient_email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {submission.consent_modules?.name || "Unknown Module"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-muted-foreground">{signedDate}</span>
                    </td>
                    <td className="px-6 py-4">
                      {withdrawn ? (
                        <Tooltip>
                          <TooltipTrigger>
                            <Badge variant="destructive" className="cursor-help">
                              <XCircle className="h-3 w-3 mr-1" />
                              Withdrawn
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            {withdrawal && (
                              <>
                                <p>
                                  Withdrawn on{" "}
                                  {format(new Date(withdrawal.withdrawn_at), "MMM d, yyyy")}
                                </p>
                                {withdrawal.reason && (
                                  <p className="text-xs mt-1">Reason: {withdrawal.reason}</p>
                                )}
                              </>
                            )}
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <Badge variant="success">Completed</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-popover">
                          {submission.pdf_url && (
                            <>
                              <DropdownMenuItem 
                                onClick={() => handleViewPdf(submission.pdf_url!)}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View PDF
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDownloadPdf(submission.pdf_url!, patientName)}
                              >
                                <Download className="h-4 w-4 mr-2" />
                                Download PDF
                              </DropdownMenuItem>
                            </>
                          )}
                          {!submission.pdf_url && (
                            <DropdownMenuItem disabled>
                              <FileText className="h-4 w-4 mr-2" />
                              PDF not available
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
