import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  Download, 
  ExternalLink,
  MoreHorizontal,
  Eye 
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ConsentSubmission {
  id: string;
  patientName: string;
  patientEmail: string;
  moduleName: string;
  signedAt: string;
  status: "completed" | "pending" | "expired";
  pdfUrl?: string;
}

const mockSubmissions: ConsentSubmission[] = [
  {
    id: "1",
    patientName: "Sarah Johnson",
    patientEmail: "sarah.j@email.com",
    moduleName: "Surgical Consent - Knee Replacement",
    signedAt: "2024-01-07 10:30 AM",
    status: "completed",
    pdfUrl: "#",
  },
  {
    id: "2",
    patientName: "Michael Chen",
    patientEmail: "m.chen@email.com",
    moduleName: "Anesthesia Consent",
    signedAt: "2024-01-07 09:15 AM",
    status: "completed",
    pdfUrl: "#",
  },
  {
    id: "3",
    patientName: "Emily Rodriguez",
    patientEmail: "emily.r@email.com",
    moduleName: "MRI Procedure Consent",
    signedAt: "Pending",
    status: "pending",
  },
  {
    id: "4",
    patientName: "James Wilson",
    patientEmail: "jwilson@email.com",
    moduleName: "Physical Therapy Consent",
    signedAt: "2024-01-06 04:45 PM",
    status: "completed",
    pdfUrl: "#",
  },
  {
    id: "5",
    patientName: "Lisa Anderson",
    patientEmail: "l.anderson@email.com",
    moduleName: "Blood Work Consent",
    signedAt: "Expired",
    status: "expired",
  },
];

const statusVariant = {
  completed: "success" as const,
  pending: "pending" as const,
  expired: "warning" as const,
};

const statusLabel = {
  completed: "Completed",
  pending: "Pending",
  expired: "Expired",
};

export function RecentSubmissionsTable() {
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
            {mockSubmissions.map((submission, index) => (
              <tr 
                key={submission.id} 
                className="hover:bg-muted/30 transition-colors animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <td className="px-6 py-4">
                  <div>
                    <p className="font-medium text-sm">{submission.patientName}</p>
                    <p className="text-xs text-muted-foreground">{submission.patientEmail}</p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{submission.moduleName}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-muted-foreground">{submission.signedAt}</span>
                </td>
                <td className="px-6 py-4">
                  <Badge variant={statusVariant[submission.status]}>
                    {statusLabel[submission.status]}
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
                      <DropdownMenuItem>
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      {submission.pdfUrl && (
                        <DropdownMenuItem>
                          <Download className="h-4 w-4 mr-2" />
                          Download PDF
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
