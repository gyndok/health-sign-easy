import { useEffect, useState } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format, subDays, eachDayOfInterval } from "date-fns";

interface DayCount {
  date: string;
  consents: number;
}

const chartConfig = {
  consents: {
    label: "Consents Signed",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

export function ConsentTrendChart() {
  const { user } = useAuth();
  const [data, setData] = useState<DayCount[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) fetchTrendData();
  }, [user]);

  const fetchTrendData = async () => {
    if (!user) return;

    const thirtyDaysAgo = subDays(new Date(), 30);

    const { data: submissions, error } = await supabase
      .from("consent_submissions")
      .select("signed_at")
      .eq("provider_id", user.id)
      .gte("signed_at", thirtyDaysAgo.toISOString())
      .order("signed_at", { ascending: true });

    if (error) {
      console.error("Error fetching trend data:", error);
      setIsLoading(false);
      return;
    }

    // Build a complete date range with all 30 days
    const days = eachDayOfInterval({
      start: thirtyDaysAgo,
      end: new Date(),
    });

    const countByDay: Record<string, number> = {};
    for (const day of days) {
      countByDay[format(day, "yyyy-MM-dd")] = 0;
    }

    // Count submissions per day
    for (const sub of submissions || []) {
      const dayKey = format(new Date(sub.signed_at!), "yyyy-MM-dd");
      if (countByDay[dayKey] !== undefined) {
        countByDay[dayKey]++;
      }
    }

    const chartData = Object.entries(countByDay).map(([date, consents]) => ({
      date,
      consents,
    }));

    setData(chartData);
    setIsLoading(false);
  };

  const totalConsents = data.reduce((sum, d) => sum + d.consents, 0);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Consent Trend</CardTitle>
          <CardDescription>Last 30 days</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[200px]">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">Consent Trend</CardTitle>
            <CardDescription>Consents signed over the last 30 days</CardDescription>
          </div>
          <div className="flex items-center gap-2 text-right">
            <div>
              <p className="text-2xl font-bold">{totalConsents}</p>
              <p className="text-xs text-muted-foreground">total this month</p>
            </div>
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[200px] w-full">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="fillConsents" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-consents)"
                  stopOpacity={0.3}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-consents)"
                  stopOpacity={0.05}
                />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => format(new Date(value), "MMM d")}
              interval="preserveStartEnd"
              minTickGap={40}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              allowDecimals={false}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => format(new Date(value), "MMM d, yyyy")}
                />
              }
            />
            <Area
              type="monotone"
              dataKey="consents"
              stroke="var(--color-consents)"
              strokeWidth={2}
              fill="url(#fillConsents)"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
