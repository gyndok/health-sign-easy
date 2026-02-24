import { useState, useEffect } from "react";
import { ProviderLayout } from "@/components/layout/ProviderLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Search,
  Download,
  Eye,
  Loader2,
  MoreHorizontal,
  CheckCircle2,
  XCircle,
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
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
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
  consent_withdrawals: ConsentWithdrawal | ConsentWithdrawal[] | null;
}

const PAGE_SIZE = 25;

export default function Submissions() {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<SubmissionWithModule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "completed" | "withdrawn">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    if (user) {
      fetchSubmissions();
    }
  }, [user, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  const fetchSubmissions = async () => {
    if (!user) return;

    setIsLoading(true);
    const from = (currentPage - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const [countResult, dataResult] = await Promise.all([
      supabase
        .from("consent_submissions")
        .select("*", { count: "exact", head: true })
        .eq("provider_id", user.id),
      supabase
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
        .range(from, to),
    ]);

    setTotalCount(countResult.count || 0);
    setSubmissions((dataResult.data as unknown as SubmissionWithModule[]) || []);
    setIsLoading(false);
  };

  const getWithdrawal = (submission: SubmissionWithModule): ConsentWithdrawal | null => {
    const w = submission.consent_withdrawals;
    if (!w) return null;
    return Array.isArray(w) ? w[0] ?? null : w;
  };

  const isWithdrawn = (submission: SubmissionWithModule) => !!getWithdrawal(submission);

  const handleDownloadPdf = async (pdfUrl: string, patientName: string) => {
    try {
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

  const handleViewPdf = (pdfUrl: string) => {
    window.open(pdfUrl, "_blank");
  };

  const formatPatientName = (firstName: string, lastName: string) => {
    return `${firstName || ""} ${lastName || ""}`.trim() || "Unknown";
  };

  const filteredSubmissions = submissions.filter((submission) => {
    const matchesSearch = !searchQuery.trim() || (() => {
      const query = searchQuery.toLowerCase();
      const fullName = `${submission.patient_first_name} ${submission.patient_last_name}`.toLowerCase();
      return (
        fullName.includes(query) ||
        submission.patient_email.toLowerCase().includes(query)
      );
    })();

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "withdrawn" && isWithdrawn(submission)) ||
      (statusFilter === "completed" && !isWithdrawn(submission));

    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  if (isLoading) {
    return (
      <ProviderLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </ProviderLayout>
    );
  }

  return (
    <ProviderLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold font-display">All Submissions</h1>
            <p className="text-muted-foreground mt-1">
              {totalCount} total consent submission{totalCount !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by patient name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 input-focus-ring"
            />
          </div>
          <div className="flex gap-2">
            {(["all", "completed", "withdrawn"] as const).map((status) => (
              <Button
                key={status}
                variant={statusFilter === status ? "outline" : "ghost"}
                size="sm"
                onClick={() => setStatusFilter(status)}
              >
                {status === "all" ? "All" : status.charAt(0).toUpperCase() + status.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        {/* Empty State */}
        {filteredSubmissions.length === 0 && (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {submissions.length === 0
                ? "No submissions yet"
                : "No submissions match your filters"}
            </h3>
            <p className="text-muted-foreground">
              {submissions.length === 0
                ? "Submissions will appear here once patients sign their consent forms"
                : "Try adjusting your search or filter"}
            </p>
          </div>
        )}

        {/* Submissions Table */}
        {filteredSubmissions.length > 0 && (
          <div className="card-elevated overflow-hidden">
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
                    const withdrawn = isWithdrawn(submission);

                    return (
                      <tr
                        key={submission.id}
                        className="hover:bg-muted/30 transition-colors animate-fade-in"
                        style={{ animationDelay: `${index * 30}ms` }}
                      >
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-sm">{patientName}</p>
                            <p className="text-xs text-muted-foreground">
                              {submission.patient_email}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm">
                            {submission.consent_modules?.name || "Unknown Module"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(submission.signed_at), "MMM d, yyyy")}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {withdrawn ? (
                            <Badge variant="destructive" className="gap-1">
                              <XCircle className="h-3 w-3" />
                              Withdrawn
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="gap-1 bg-green-500/10 text-green-600 border-green-500/20">
                              <CheckCircle2 className="h-3 w-3" />
                              Completed
                            </Badge>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {submission.pdf_url ? (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleViewPdf(submission.pdf_url!)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View PDF
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleDownloadPdf(submission.pdf_url!, patientName)
                                  }
                                >
                                  <Download className="h-4 w-4 mr-2" />
                                  Download PDF
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          ) : (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="text-xs text-muted-foreground">No PDF</span>
                              </TooltipTrigger>
                              <TooltipContent>
                                PDF not yet generated for this submission
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <PaginationItem key={pageNum}>
                    <PaginationLink
                      isActive={currentPage === pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className="cursor-pointer"
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}
              <PaginationItem>
                <PaginationNext
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>
    </ProviderLayout>
  );
}
