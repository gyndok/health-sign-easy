import { Link } from "react-router-dom";
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
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Invitation {
  id: string;
  patientName: string;
  patientEmail: string;
  moduleName: string;
  status: "pending" | "viewed" | "completed" | "expired";
  sentAt: string;
  expiresAt: string;
}

const mockInvitations: Invitation[] = [
  {
    id: "1",
    patientName: "Sarah Johnson",
    patientEmail: "sarah.j@email.com",
    moduleName: "Surgical Consent - Knee Replacement",
    status: "completed",
    sentAt: "2024-01-07 08:00 AM",
    expiresAt: "2024-01-14",
  },
  {
    id: "2",
    patientName: "Michael Chen",
    patientEmail: "m.chen@email.com",
    moduleName: "Anesthesia Consent",
    status: "viewed",
    sentAt: "2024-01-07 09:30 AM",
    expiresAt: "2024-01-14",
  },
  {
    id: "3",
    patientName: "Emily Rodriguez",
    patientEmail: "emily.r@email.com",
    moduleName: "MRI Procedure Consent",
    status: "pending",
    sentAt: "2024-01-06 02:15 PM",
    expiresAt: "2024-01-13",
  },
  {
    id: "4",
    patientName: "James Wilson",
    patientEmail: "jwilson@email.com",
    moduleName: "Physical Therapy Consent",
    status: "completed",
    sentAt: "2024-01-05 11:00 AM",
    expiresAt: "2024-01-12",
  },
  {
    id: "5",
    patientName: "Lisa Anderson",
    patientEmail: "l.anderson@email.com",
    moduleName: "Blood Work Consent",
    status: "expired",
    sentAt: "2023-12-28 03:45 PM",
    expiresAt: "2024-01-04",
  },
];

const statusConfig = {
  pending: {
    variant: "pending" as const,
    label: "Pending",
    icon: Clock,
  },
  viewed: {
    variant: "warning" as const,
    label: "Viewed",
    icon: Eye,
  },
  completed: {
    variant: "success" as const,
    label: "Completed",
    icon: CheckCircle2,
  },
  expired: {
    variant: "destructive" as const,
    label: "Expired",
    icon: XCircle,
  },
};

export default function Invitations() {
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
              className="pl-9 input-focus-ring"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm">All</Button>
            <Button variant="ghost" size="sm">Pending</Button>
            <Button variant="ghost" size="sm">Viewed</Button>
            <Button variant="ghost" size="sm">Completed</Button>
            <Button variant="ghost" size="sm">Expired</Button>
          </div>
        </div>

        {/* Invitations Table */}
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
                {mockInvitations.map((invitation, index) => {
                  const status = statusConfig[invitation.status];
                  const StatusIcon = status.icon;
                  
                  return (
                    <tr
                      key={invitation.id}
                      className="hover:bg-muted/30 transition-colors animate-fade-in"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-sm">{invitation.patientName}</p>
                          <p className="text-xs text-muted-foreground">{invitation.patientEmail}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm">{invitation.moduleName}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-muted-foreground">{invitation.sentAt}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-muted-foreground">{invitation.expiresAt}</span>
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
                            {invitation.status === "pending" || invitation.status === "viewed" ? (
                              <DropdownMenuItem>
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Resend
                              </DropdownMenuItem>
                            ) : null}
                            {invitation.status === "expired" && (
                              <DropdownMenuItem>
                                <Send className="h-4 w-4 mr-2" />
                                Send New Invite
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive">
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
      </div>
    </ProviderLayout>
  );
}
