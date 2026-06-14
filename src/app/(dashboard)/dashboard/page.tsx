"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Briefcase, TrendingUp, Trophy, XCircle, Percent } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ActivityFeed } from "@/components/activity/ActivityFeed";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

async function fetchStats() {
  const res = await fetch("/api/analytics");
  if (!res.ok) throw new Error("Failed to fetch stats");
  return res.json();
}

async function fetchActivity() {
  const res = await fetch("/api/activity?limit=10");
  if (!res.ok) throw new Error("Failed to fetch activity");
  return res.json();
}

async function fetchAnalytics() {
  const res = await fetch("/api/analytics?full=true");
  if (!res.ok) throw new Error("Failed to fetch analytics");
  return res.json();
}

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: fetchStats,
  });

  const { data: activities, isLoading: activityLoading } = useQuery({
    queryKey: ["activity"],
    queryFn: fetchActivity,
  });

  const { data: analytics } = useQuery({
    queryKey: ["analytics-mini"],
    queryFn: fetchAnalytics,
  });

  const cards = [
    { label: "Applications", value: stats?.totalApplications ?? 0, icon: Briefcase, trend: stats?.trendApplications },
    { label: "Interviews", value: stats?.interviewCount ?? 0, icon: TrendingUp },
    { label: "Offers", value: stats?.offerCount ?? 0, icon: Trophy },
    { label: "Rejections", value: stats?.rejectionCount ?? 0, icon: XCircle },
    { label: "Response Rate", value: `${Math.round(stats?.responseRate ?? 0)}%`, icon: Percent },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Your career command center</p>
        </div>
        <Link href="/applications/new">
          <Button>Add Application</Button>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map((card) => (
          <Card key={card.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{card.label}</CardTitle>
              <card.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{card.value}</div>
                  {card.trend !== undefined && (
                    <p className={`text-xs ${card.trend >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {card.trend >= 0 ? "+" : ""}{card.trend} this month
                    </p>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Applications by Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              {analytics?.applicationsByMonth?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.applicationsByMonth}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  No data yet
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {activityLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : (
              <ActivityFeed activities={activities ?? []} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
