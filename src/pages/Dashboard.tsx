import { ProviderLayout } from "@/components/layout/ProviderLayout";
import { StatCard, FileText, Users, Clock, CheckCircle2 } from "@/components/dashboard/StatCard";
import { RecentSubmissionsTable } from "@/components/dashboard/RecentSubmissionsTable";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export default function Dashboard() {
  return (
    <ProviderLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold font-display">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Welcome back, Dr. Roberts. Here's your consent overview.
            </p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search patients..." 
              className="pl-9 input-focus-ring"
            />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Pending Consents"
            value={12}
            description="Awaiting patient signature"
            icon={Clock}
            variant="warning"
          />
          <StatCard
            title="Completed Today"
            value={8}
            description="Signed consents"
            icon={CheckCircle2}
            variant="success"
            trend={{ value: 23, isPositive: true }}
          />
          <StatCard
            title="Total Modules"
            value={24}
            description="Active consent forms"
            icon={FileText}
            variant="primary"
          />
          <StatCard
            title="Total Patients"
            value={156}
            description="In your practice"
            icon={Users}
            variant="default"
            trend={{ value: 12, isPositive: true }}
          />
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <RecentSubmissionsTable />
          </div>
          <div className="lg:col-span-1">
            <QuickActions />
          </div>
        </div>
      </div>
    </ProviderLayout>
  );
}
