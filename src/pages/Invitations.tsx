import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ProviderLayout } from "@/components/layout/ProviderLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Search,
  Send,
  MoreHorizontal,
  RefreshCw,
  Trash2,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  Loader2,
  Copy,
  ExternalLink,
  FileDown,
  AlertTriangle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Tables } from "@/integrations/supabase/types";

type InviteStatus = "pending" | "viewed" | "completed" | "expired" | "withdrawn";

interface ConsentWithdrawal {
  id: string;
  withdrawn_at: string;
  reason: string | null;
}

interface InviteWithModule extends Tables<"invites"> {
  consent_modules: {
    name: string;
  } | null;
  consent_submissions: {
    id: string;
    pdf_url: string | null;
    consent_withdrawals: ConsentWithdrawal | ConsentWithdrawal[] | null;
  }[] | null;
}

const statusConfig: Record<InviteStatus, { variant: "default" | "secondary" | "destructive" | "outline" | "success"; label: string; icon: typeof Clock }> = {
  pending: {
    variant: "secondary",
    label: "Pending",
    icon: Clock,
  },
  viewed: {
    variant: "outline",
    label: "Viewed",
    icon: Eye,
  },
  completed: {
    variant: "success",
    label: "Completed",
    icon: CheckCircle2,
  },
  expired: {
    variant: "destructive",
    label: "Expired",
    icon: XCircle,
  },
  withdrawn: {
    variant: "destructive",
    label: "Withdrawn",
    icon: AlertTriangle,
  },
};

export default function Invitations() {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [invitations, setInvitations] = useState<InviteWithModule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<InviteStatus | "all">("all");
  const [deleteInvite, setDeleteInvite] = useState<InviteWithModule | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchInvitations();
    }
  }, [user]);

  const fetchInvitations = async () => {
    if (!user) return;

    setIsLoading(true);
    const { data, error } = await supabase
      .from("invites")
      .select(`
        *,
        consent_modules (
          name
        ),
        consent_submissions (
          id,
          pdf_url,
          consent_withdrawals (
            id,
            withdrawn_at,
            reason
          )
        )
      `)
      .eq("created_by", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching invitations:", error);
      toast.error("Failed to load invitations");
    } else {
      const now = new Date();
      const updatedInvites = (data || []).map((invite) => {
        if (
          invite.status === "pending" &&
          new Date(invite.expires_at) < now
        ) {
          return { ...invite, status: "expired" as const };
        }
        return invite;
      });
      setInvitations(updatedInvites);
    }
    setIsLoading(false);
  };

  const handleDelete = async () => {
    if (!deleteInvite) return;

    setIsDeleting(true);
    const { error } = await supabase
      .from("invites")
      .delete()
      .eq("id", deleteInvite.id);

    if (error) {
      console.error("Error deleting invitation:", error);
      toast.error("Failed to delete invitation");
    } else {
      toast.success("Invitation deleted");
      setInvitations(invitations.filter((i) => i.id !== deleteInvite.id));
    }
    setIsDeleting(false);
    setDeleteInvite(null);
  };

  const handleResend = async (invite: InviteWithModule) => {
    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + 7);

    const { error } = await supabase
      .from("invites")
      .update({
        expires_at: newExpiresAt.toISOString(),
        status: "pending",
      })
      .eq("id", invite.id);

    if (error) {
      console.error("Error resending invitation:", error);
      toast.error("Failed to resend invitation");
    } else {
      toast.success("Invitation resent!", {
        description: `A new link has been generated.`,
      });
      fetchInvitations();
    }
  };

  const handleCopyLink = (token: string) => {
    const link = `${window.location.origin}/consent/${token}`;
    navigator.clipboard.writeText(link);
    toast.success("Link copied to clipboard!");
  };

  const handleSendNew = (invite: InviteWithModule) => {
    navigate(`/invitations/new?module=${invite.module_id}&email=${invite.patient_email}`);
  };

  const openPdf = async (invite: InviteWithModule) => {
    const submissionId = invite.consent_submissions?.[0]?.id;
    if (!submissionId) {
      toast.error("No submission found for this invitation");
      return;
    }

    const toastId = "pdf-download";
    toast.loading("Generating PDF...", { id: toastId });

    // Always regenerate to ensure latest format
    const { data, error } = await supabase.functions.invoke("generate-consent-pdf", {
      body: { submissionId, regenerate: true },
    });

    if (error || !data?.pdfUrl) {
      console.error("PDF error:", error);
      toast.error("Failed to generate PDF", { id: toastId });
      return;
    }

    // Download the freshly generated PDF directly from signed URL (avoids storage SDK caching)
    const pdfUrl: string = data.pdfUrl;

    try {
      const response = await fetch(pdfUrl);
      if (!response.ok) throw new Error("Download failed");
      const fileBlob = await response.blob();

      const objectUrl = URL.createObjectURL(fileBlob);
      const a = document.createElement("a");
      a.href = objectUrl;

      // Use a unique filename to avoid the OS/browser re-opening an older cached download
      const stamp = new Date().toISOString().replace(/[:.]/g, "-");
      a.download = `consent-${submissionId}-${stamp}.pdf`;

      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objectUrl);

      toast.success("PDF downloaded", { id: toastId });
    } catch (e) {
      console.warn("Could not download PDF via fetch, falling back to opening in new tab", e);
      toast.success("Opening PDF...", { id: toastId });
      window.open(pdfUrl, "_blank", "noopener,noreferrer");
    }

    fetchInvitations();
  };

  // Helper to check if an invite has a withdrawal
  const getWithdrawal = (invite: InviteWithModule): ConsentWithdrawal | null => {
    const submission = invite.consent_submissions?.[0];
    if (!submission) return null;
    const w = submission.consent_withdrawals;
    if (!w) return null;
    return Array.isArray(w) ? w[0] ?? null : w;
  };

  const getEffectiveStatus = (invite: InviteWithModule): InviteStatus => {
    // Check for withdrawal first (takes priority over completed)
    if (invite.status === "completed" && getWithdrawal(invite)) {
      return "withdrawn";
    }
    // Check for expiration
    if (invite.status === "pending" && new Date(invite.expires_at) < new Date()) {
      return "expired";
    }
    return invite.status as InviteStatus;
  };

  const filteredInvitations = invitations.filter((invite) => {
    const matchesSearch =
      (invite.patient_first_name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (invite.patient_last_name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      invite.patient_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (invite.consent_modules?.name?.toLowerCase() || "").includes(searchQuery.toLowerCase());

    const effectiveStatus = getEffectiveStatus(invite);

    const matchesStatus =
      statusFilter === "all" || effectiveStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (authLoading || isLoading) {
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
            <h1 className="text-3xl font-bold font-display">Invitations</h1>
            <p className="text-muted-foreground mt-1">
              Track and manage consent invitation requests
            </p>
          </div>
          <Button asChild>
            <Link to="/invitations/new">
              <Plus className="h-4 w-4 mr-2" />
              Send Invitation
            </Link>
          </Button>
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
          <div className="flex gap-2 flex-wrap">
            {(["all", "pending", "viewed", "completed", "withdrawn", "expired"] as const).map(
              (status) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? "outline" : "ghost"}
                  size="sm"
                  onClick={() => setStatusFilter(status)}
                >
                  {status === "all" ? "All" : status.charAt(0).toUpperCase() + status.slice(1)}
                </Button>
              )
            )}
          </div>
        </div>

        {/* Empty State */}
        {filteredInvitations.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <Send className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {invitations.length === 0
                ? "No invitations yet"
                : "No invitations match your search"}
            </h3>
            <p className="text-muted-foreground mb-4">
              {invitations.length === 0
                ? "Send your first consent invitation to a patient"
                : "Try adjusting your search or filter"}
            </p>
            {invitations.length === 0 && (
              <Button asChild>
                <Link to="/invitations/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Send Invitation
                </Link>
              </Button>
            )}
          </div>
        )}

        {/* Invitations Table */}
        {filteredInvitations.length > 0 && (
          <div className="card-elevated overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3">
                      Patient
                    </th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3">
                      Module
                    </th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3">
                      Sent
                    </th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3">
                      Expires
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
                  {filteredInvitations.map((invitation, index) => {
                    const effectiveStatus = getEffectiveStatus(invitation);
                    const status = statusConfig[effectiveStatus];
                    const StatusIcon = status.icon;

                    return (
                      <tr
                        key={invitation.id}
                        className="hover:bg-muted/30 transition-colors animate-fade-in"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-sm">
                              {invitation.patient_first_name && invitation.patient_last_name
                                ? `${invitation.patient_first_name} ${invitation.patient_last_name}`
                                : <span className="text-muted-foreground italic">Pending</span>}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {invitation.patient_email}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm">
                            {invitation.consent_modules?.name || "Unknown Module"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-muted-foreground">
                            {new Date(invitation.created_at).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-muted-foreground">
                            {new Date(invitation.expires_at).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={status.variant} className="gap-1">
                            <StatusIcon className="h-3 w-3" />
                            {status.label}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {effectiveStatus !== "completed" && effectiveStatus !== "expired" && effectiveStatus !== "withdrawn" && (
                                <>
                                  <DropdownMenuItem
                                    onClick={() => handleCopyLink(invitation.token)}
                                  >
                                    <Copy className="h-4 w-4 mr-2" />
                                    Copy Link
                                  </DropdownMenuItem>
                                  <DropdownMenuItem asChild>
                                    <a
                                      href={`/consent/${invitation.token}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      <ExternalLink className="h-4 w-4 mr-2" />
                                      Open Link
                                    </a>
                                  </DropdownMenuItem>
                                </>
                              )}
                              {(effectiveStatus === "pending" || effectiveStatus === "viewed") && (
                                <DropdownMenuItem onClick={() => handleResend(invitation)}>
                                  <RefreshCw className="h-4 w-4 mr-2" />
                                  Resend
                                </DropdownMenuItem>
                              )}
                              {effectiveStatus === "expired" && (
                                <DropdownMenuItem onClick={() => handleSendNew(invitation)}>
                                  <Send className="h-4 w-4 mr-2" />
                                  Send New Invite
                                </DropdownMenuItem>
                              )}
                              {(effectiveStatus === "completed" || effectiveStatus === "withdrawn") && (
                                <>
                                  <DropdownMenuItem onClick={() => openPdf(invitation)}>
                                    <FileDown className="h-4 w-4 mr-2" />
                                    Download PDF
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => openPdf(invitation)}>
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                    Regenerate PDF
                                  </DropdownMenuItem>
                                </>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => setDeleteInvite(invitation)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteInvite} onOpenChange={() => setDeleteInvite(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Invitation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the invitation for{" "}
              {deleteInvite?.patient_email}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ProviderLayout>
  );
}
