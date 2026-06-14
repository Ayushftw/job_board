import { activityRepository } from "@/repositories/activity.repository";

const ACTION_LABELS: Record<string, string> = {
  APPLICATION_CREATED: "Applied to",
  STATUS_CHANGED: "Status updated for",
  INTERVIEW_SCHEDULED: "Interview scheduled for",
  RESUME_UPLOADED: "Uploaded resume",
  OFFER_RECEIVED: "Offer received from",
  RECRUITER_REPLIED: "Recruiter replied for",
  AI_MATCH_ANALYZED: "AI match analysis for",
  MESSAGE_GENERATED: "Generated message for",
};

export const activityService = {
  async getRecent(userId: string, limit = 20) {
    const activities = await activityRepository.findRecent(userId, limit);
    return activities.map((a) => ({
      id: a.id,
      action: a.action,
      label: ACTION_LABELS[a.action] ?? a.action,
      company: a.application?.company,
      role: a.application?.role,
      applicationId: a.applicationId,
      metadata: a.metadata,
      createdAt: a.createdAt,
    }));
  },

  formatMessage(activity: {
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
  },
};
