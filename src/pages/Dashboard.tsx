import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ProviderLayout } from "@/components/layout/ProviderLayout";
import { StatCard, FileText, Users, Clock, CheckCircle2 } from "@/components/dashboard/StatCard";
import { RecentSubmissionsTable } from "@/components/dashboard/RecentSubmissionsTable";
import { RecentWithdrawals } from "@/components/dashboard/RecentWithdrawals";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { Input } from "@/components/ui/input";
import { Search, AlertTriangle, MessageCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useDemoTour } from "@/hooks/useDemoTour";
import { OnboardingBanner } from "@/components/onboarding/OnboardingBanner";

interface DashboardStats {
  pendingConsents: number;
  completedToday: number;
  totalModules: number;
  totalPatients: number;
  withdrawalsCount: number;
  unreadMessages: number;
}

export default function Dashboard() {
  const { user, profile } = useAuth();
  const { startTour } = useDemoTour();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [stats, setStats] = useState<DashboardStats>({
    pendingConsents: 0,
    completedToday: 0,
    totalModules: 0,
    totalPatients: 0,
    withdrawalsCount: 0,
    unreadMessages: 0,
  });

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user]);

  // Auto-start tour from URL param (e.g., after seeding demo data)
  useEffect(() => {
    if (searchParams.get("tour") === "start") {
      const timer = setTimeout(() => {
        startTour();
        setSearchParams({}, { replace: true });
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [searchParams, startTour, setSearchParams]);

  const fetchStats = async () => {
    if (!user) return;

    // Fetch pending invites count
    const { count: pendingCount } = await supabase
      .from("invites")
      .select("*", { count: "exact", head: true })
      .eq("created_by", user.id)
      .eq("status", "pending");

    // Fetch today's completed count
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { count: completedCount } = await supabase
      .from("consent_submissions")
      .select("*", { count: "exact", head: true })
      .eq("provider_id", user.id)
      .gte("signed_at", today.toISOString());

    // Fetch total modules count
    const { count: modulesCount } = await supabase
      .from("consent_modules")
      .select("*", { count: "exact", head: true })
      .eq("created_by", user.id);

    // Fetch unique patients count
    const { count: patientsCount } = await supabase
      .from("invites")
      .select("patient_email", { count: "exact", head: true })
      .eq("created_by", user.id);

    // Fetch withdrawals count for this provider's submissions
    const { data: withdrawalsData } = await supabase
      .from("consent_withdrawals")
      .select(`
        id,
        consent_submissions!inner (
          provider_id
        )
      `)
      .eq("consent_submissions.provider_id", user.id);

    // Fetch unread message counts
    const { data: messageCounts } = await supabase.rpc("get_invite_unread_message_counts");
    const totalUnread = (messageCounts || []).reduce(
      (sum: number, row: { patient_message_count: number }) => sum + row.patient_message_count,
      0
    );

    setStats({
      pendingConsents: pendingCount || 0,
      completedToday: completedCount || 0,
      totalModules: modulesCount || 0,
      totalPatients: patientsCount || 0,
      withdrawalsCount: withdrawalsData?.length || 0,
      unreadMessages: totalUnread,
    });
  };

  const displayName = profile?.full_name || user?.email?.split("@")[0] || "Provider";

  return (
    <ProviderLayout>
      <div className="space-y-8">
        <OnboardingBanner />
        {/* Header */}
        <div data-tour="dashboard-header" className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold font-display">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Welcome back, {displayName}. Here's your consent overview.
            </p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search patients..." 
              className="pl-9 input-focus-ring"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Stats Grid */}
        <div data-tour="stats-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
          <StatCard
            title="Pending Consents"
            value={stats.pendingConsents}
            description="Awaiting patient signature"
            icon={Clock}
            variant="warning"
          />
          <StatCard
            title="Completed Today"
            value={stats.completedToday}
            description="Signed consents"
            icon={CheckCircle2}
            variant="success"
          />
          <StatCard
            title="Total Modules"
            value={stats.totalModules}
            description="Active consent forms"
            icon={FileText}
            variant="primary"
          />
          <StatCard
            title="Total Patients"
            value={stats.totalPatients}
            description="Invited to sign"
            icon={Users}
            variant="default"
          />
          <StatCard
            title="Patient Messages"
            value={stats.unreadMessages}
            description="Awaiting response"
            icon={MessageCircle}
            variant={stats.unreadMessages > 0 ? "warning" : "default"}
          />
          <StatCard
            title="Withdrawals"
            value={stats.withdrawalsCount}
            description="Consents withdrawn"
            icon={AlertTriangle}
            variant={stats.withdrawalsCount > 0 ? "warning" : "default"}
          />
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <RecentSubmissionsTable searchQuery={searchQuery} />
          </div>
          <div className="lg:col-span-1 space-y-6">
            <QuickActions />
            <RecentWithdrawals />
          </div>
        </div>
      </div>
    </ProviderLayout>
  );
}
