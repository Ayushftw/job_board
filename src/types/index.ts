import { ApplicationStatus, MessageType, ParseStatus } from "@prisma/client";

export const APPLICATION_STATUSES: ApplicationStatus[] = [
  "APPLIED",
  "SCREENING",
  "TECHNICAL",
  "MANAGER_ROUND",
  "FINAL_ROUND",
  "OFFER",
  "REJECTED",
];

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  APPLIED: "Applied",
  SCREENING: "Screening",
  TECHNICAL: "Technical",
  MANAGER_ROUND: "Manager Round",
  FINAL_ROUND: "Final Round",
  OFFER: "Offer",
  REJECTED: "Rejected",
};

export const STATUS_COLORS: Record<ApplicationStatus, string> = {
  APPLIED: "bg-blue-500/10 text-blue-600",
  SCREENING: "bg-purple-500/10 text-purple-600",
  TECHNICAL: "bg-orange-500/10 text-orange-600",
  MANAGER_ROUND: "bg-yellow-500/10 text-yellow-600",
  FINAL_ROUND: "bg-indigo-500/10 text-indigo-600",
  OFFER: "bg-green-500/10 text-green-600",
  REJECTED: "bg-red-500/10 text-red-600",
};

export const MESSAGE_TYPE_LABELS: Record<MessageType, string> = {
  REFERRAL: "Referral Request",
  FOLLOW_UP: "Follow-up Email",
  OUTREACH: "Recruiter Outreach",
  THANK_YOU: "Thank You Email",
};

export const PARSE_STATUS_LABELS: Record<ParseStatus, string> = {
  PENDING: "Pending",
  PROCESSING: "Processing",
  DONE: "Complete",
  FAILED: "Failed",
};

export interface MatchScoreResult {
  score: number;
  matchedSkills: string[];
  missingSkills: string[];
  recommendations: string[];
}

export interface InterviewPrepResult {
  questions: Array<{ type: string; question: string; tip: string }>;
  roadmap: string[];
}

export interface ResumeProfileData {
  skills: string[];
  technologies: string[];
  yearsOfExperience: number;
  education: Array<{ degree: string; school: string; year?: string }>;
  summary?: string;
}

export interface AnalyticsData {
  totalApplications: number;
  interviewCount: number;
  offerCount: number;
  rejectionCount: number;
  responseRate: number;
  applicationsByMonth: Array<{ month: string; count: number }>;
  statusBreakdown: Array<{ status: string; count: number }>;
  conversionFunnel: Array<{ stage: string; count: number }>;
  responseRateTrend: Array<{ date: string; rate: number }>;
  resumePerformance: Array<{ name: string; interviews: number; offers: number }>;
}

export interface DashboardStats {
  totalApplications: number;
  interviewCount: number;
  offerCount: number;
  rejectionCount: number;
  responseRate: number;
  trendApplications: number;
}

export interface ApiError {
  error: string;
  details?: unknown;
}
