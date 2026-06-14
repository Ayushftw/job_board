"use client";

import { formatRelativeTime } from "@/lib/utils";
import { Briefcase, Calendar, FileText, Sparkles, TrendingUp } from "lucide-react";

const ICONS: Record<string, React.ElementType> = {
  APPLICATION_CREATED: Briefcase,
  STATUS_CHANGED: TrendingUp,
  INTERVIEW_SCHEDULED: Calendar,
  RESUME_UPLOADED: FileText,
  AI_MATCH_ANALYZED: Sparkles,
  MESSAGE_GENERATED: Sparkles,
};

function formatActivityMessage(activity: {
  action: string;
  label: string;
  company?: string | null;
  role?: string | null;
  metadata?: unknown;
}) {
  const meta = activity.metadata as Record<string, string> | null;
  if (activity.action === "STATUS_CHANGED" && meta?.label) {
    return `${activity.label} ${activity.company} — ${meta.label}`;
  }
  if (activity.company) {
    return `${activity.label} ${activity.company}${activity.role ? ` (${activity.role})` : ""}`;
  }
  return activity.label;
}

interface ActivityItem {
  id: string;
  action: string;
  label: string;
  company?: string | null;
  role?: string | null;
  createdAt: string | Date;
}

export function ActivityFeed({ activities }: { activities: ActivityItem[] }) {
  if (activities.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">
        No activity yet. Create your first application to get started.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => {
        const Icon = ICONS[activity.action] ?? Briefcase;
        const message = formatActivityMessage(activity);
        return (
          <div key={activity.id} className="flex items-start gap-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
              <Icon className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm">{message}</p>
              <p className="text-xs text-muted-foreground">
                {formatRelativeTime(activity.createdAt)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
