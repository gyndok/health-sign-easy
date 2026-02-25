import { useEffect, useState, useCallback } from "react";
import { ProviderLayout } from "@/components/layout/ProviderLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ClipboardList,
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Filter,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface AuditEntry {
  id: string;
  action: string;
  resource_type: string;
  resource_id: string | null;
  details: Record<string, unknown> | null;
  actor_id: string | null;
  org_id: string | null;
  created_at: string;
  actor_email: string | null;
}

const PAGE_SIZE = 25;

const actionColors: Record<string, string> = {
  "user.login": "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  "user.logout": "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300",
  "consent.signed": "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  "consent.withdrawn": "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  "invite.created": "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  "invite.deleted": "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  "pdf.downloaded": "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300",
  "pdf.viewed": "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300",
};

const actionLabels: Record<string, string> = {
  "user.login": "Login",
  "user.logout": "Logout",
  "consent.signed": "Consent Signed",
  "consent.withdrawn": "Consent Withdrawn",
  "invite.created": "Invite Created",
  "invite.deleted": "Invite Deleted",
  "pdf.downloaded": "PDF Downloaded",
  "pdf.viewed": "PDF Viewed",
};

const actionFilterOptions = [
  { value: "all", label: "All Actions" },
  { value: "user.login", label: "Login" },
  { value: "user.logout", label: "Logout" },
  { value: "consent.signed", label: "Consent Signed" },
  { value: "consent.withdrawn", label: "Consent Withdrawn" },
  { value: "invite.created", label: "Invite Created" },
  { value: "invite.deleted", label: "Invite Deleted" },
  { value: "pdf.downloaded", label: "PDF Downloaded" },
  { value: "pdf.viewed", label: "PDF Viewed" },
];

const dateRangeOptions = [
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
  { value: "all", label: "All time" },
];

export default function AuditLog() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [dateRange, setDateRange] = useState("30");

  const fetchEntries = useCallback(async () => {
    setIsLoading(true);

    const params: Record<string, unknown> = {
      p_limit: PAGE_SIZE + 1, // +1 to detect if there's a next page
      p_offset: page * PAGE_SIZE,
    };

    if (actionFilter !== "all") {
      params.p_action_filter = actionFilter;
    }
    if (searchQuery.trim()) {
      params.p_search = searchQuery.trim();
    }
    if (dateRange !== "all") {
      params.p_days = parseInt(dateRange);
    }

    const { data, error } = await supabase.rpc(
      "get_audit_log_entries" as any,
      params
    );

    if (error) {
      console.error("Error fetching audit log:", error);
      setEntries([]);
      setHasMore(false);
    } else {
      const rows = (data || []) as AuditEntry[];
      setHasMore(rows.length > PAGE_SIZE);
      setEntries(rows.slice(0, PAGE_SIZE));
    }

    setIsLoading(false);
  }, [page, actionFilter, searchQuery, dateRange]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  // Reset page when filters change
  useEffect(() => {
    setPage(0);
  }, [actionFilter, searchQuery, dateRange]);

  const formatDetails = (details: Record<string, unknown> | null) => {
    if (!details) return null;
    return Object.entries(details)
      .filter(([, v]) => v != null)
      .map(([k, v]) => `${k}: ${v}`)
      .join(", ");
  };

  return (
    <ProviderLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold font-display flex items-center gap-2">
            <ClipboardList className="h-8 w-8" />
            Audit Log
          </h1>
          <p className="text-muted-foreground mt-1">
            Track all consent-related activity in your organization
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search actions, resources..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by action" />
            </SelectTrigger>
            <SelectContent>
              {actionFilterOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Date range" />
            </SelectTrigger>
            <SelectContent>
              {dateRangeOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-44">Timestamp</TableHead>
                <TableHead className="w-48">User</TableHead>
                <TableHead className="w-40">Action</TableHead>
                <TableHead className="w-32">Resource</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : entries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                    No audit entries found
                  </TableCell>
                </TableRow>
              ) : (
                entries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {format(new Date(entry.created_at), "MMM d, yyyy h:mm a")}
                    </TableCell>
                    <TableCell className="text-sm">
                      {entry.actor_email || "System"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={actionColors[entry.action] || ""}
                      >
                        {actionLabels[entry.action] || entry.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {entry.resource_type}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                      {formatDetails(entry.details as Record<string, unknown> | null)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page + 1}
            {entries.length > 0 && ` \u00B7 Showing ${entries.length} entries`}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={!hasMore}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </ProviderLayout>
  );
}
