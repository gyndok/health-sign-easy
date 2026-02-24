import { useInView } from "@/hooks/useInView";
import { useCountUp } from "@/hooks/useCountUp";
import { Clock, CheckCircle2, FileText, Users, AlertTriangle } from "lucide-react";

interface PreviewStat {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
}

const previewStats: PreviewStat[] = [
  { label: "Pending", value: 3, icon: Clock, color: "text-amber-500" },
  { label: "Completed Today", value: 5, icon: CheckCircle2, color: "text-green-500" },
  { label: "Modules", value: 12, icon: FileText, color: "text-primary" },
  { label: "Patients", value: 48, icon: Users, color: "text-foreground" },
];

const previewRows = [
  { patient: "Sarah Johnson", module: "Knee Arthroscopy", date: "Feb 24, 2026", status: "Completed" },
  { patient: "David Kim", module: "LASIK Eye Surgery", date: "Feb 23, 2026", status: "Completed" },
  { patient: "Emily Rodriguez", module: "Dermal Filler", date: "Feb 22, 2026", status: "Completed" },
  { patient: "Michael Chang", module: "Colonoscopy", date: "Feb 21, 2026", status: "Withdrawn" },
];

function StatBox({ stat, isInView }: { stat: PreviewStat; isInView: boolean }) {
  const count = useCountUp(stat.value, 1200, isInView);

  return (
    <div className="bg-background rounded-lg border border-border p-3 text-center">
      <stat.icon className={`h-4 w-4 mx-auto mb-1 ${stat.color}`} />
      <p className="text-2xl font-bold font-display">{count}</p>
      <p className="text-[10px] text-muted-foreground">{stat.label}</p>
    </div>
  );
}

export function ProductPreview() {
  const { ref, isInView } = useInView();

  return (
    <section className="py-20 sm:py-28">
      <div className="container">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold font-display mb-4">
            Your Dashboard, at a Glance
          </h2>
          <p className="text-lg text-muted-foreground">
            Track every consent from invitation to completion
          </p>
        </div>

        <div
          ref={ref}
          className={`max-w-4xl mx-auto transition-all duration-700 ${
            isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          {/* Browser chrome frame */}
          <div className="browser-frame">
            <div className="browser-frame-header">
              <div className="browser-frame-dots">
                <span className="bg-red-400" />
                <span className="bg-amber-400" />
                <span className="bg-green-400" />
              </div>
              <div className="browser-frame-url">
                clearconsent.net/dashboard
              </div>
            </div>

            {/* Dashboard preview content */}
            <div className="p-4 sm:p-6 bg-background space-y-4">
              {/* Stats row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {previewStats.map((stat) => (
                  <StatBox key={stat.label} stat={stat} isInView={isInView} />
                ))}
              </div>

              {/* Mini submissions table */}
              <div className="rounded-lg border border-border overflow-hidden">
                <div className="px-4 py-3 bg-muted/50 border-b border-border">
                  <h3 className="text-sm font-semibold">Recent Submissions</h3>
                </div>
                <div className="divide-y divide-border">
                  {previewRows.map((row) => (
                    <div key={row.patient} className="px-4 py-2.5 flex items-center justify-between text-xs sm:text-sm">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-[10px] font-semibold text-primary">
                            {row.patient.split(" ").map(n => n[0]).join("")}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate">{row.patient}</p>
                          <p className="text-muted-foreground text-[10px] sm:text-xs truncate">{row.module}</p>
                        </div>
                      </div>
                      <div className="hidden sm:block text-muted-foreground text-xs">
                        {row.date}
                      </div>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        row.status === "Completed"
                          ? "bg-green-500/10 text-green-600"
                          : "bg-red-500/10 text-red-600"
                      }`}>
                        {row.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
