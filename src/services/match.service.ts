import {
  generateText,
  streamText,
  parseJsonFromAI,
  MATCH_SCORE_PROMPT,
  INTERVIEW_PREP_PROMPT,
  MESSAGE_PROMPT,
  RESUME_PARSE_PROMPT,
  OUTREACH_EMAIL_PROMPT,
} from "@/lib/gemini";
import { resumeRepository } from "@/repositories/resume.repository";
import { applicationRepository } from "@/repositories/application.repository";
import { userRepository } from "@/repositories/user.repository";
import {
  aiMessageRepository,
  activityRepository,
  usageMetricsRepository,
} from "@/repositories/activity.repository";
import { cacheAside } from "@/lib/redis";
import type { MatchScoreResult, InterviewPrepResult, ResumeProfileData } from "@/types";
import type { GenerateMessageInput } from "@/dto/ai.dto";

export interface OutreachEmailResult {
  subject: string;
  body: string;
}

function extractStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
  }
  if (typeof value === "string" && value.trim()) {
    return [value.trim()];
  }
  return [];
}

function getProfileSkills(profile: { skills: unknown; technologies: unknown }): string[] {
  const fromValue = (value: unknown): string[] => {
    if (Array.isArray(value)) return extractStringArray(value);
    if (typeof value === "string") {
      try {
        const parsed = JSON.parse(value) as unknown;
        if (Array.isArray(parsed)) return extractStringArray(parsed);
      } catch {
        return value.trim() ? [value.trim()] : [];
      }
    }
    return [];
  };

  return [...new Set([...fromValue(profile.skills), ...fromValue(profile.technologies)].map((s) => s.trim()))];
}

function normalizeMatchScoreResult(raw: unknown): MatchScoreResult | null {
  if (!raw || typeof raw !== "object") return null;

  const record = raw as Record<string, unknown>;
  const nestedSkills =
    record.skills && typeof record.skills === "object"
      ? (record.skills as Record<string, unknown>)
      : null;

  const matchedSkills = extractStringArray(
    record.matchedSkills ??
      record.matched_skills ??
      record.matched ??
      nestedSkills?.matched ??
      nestedSkills?.matchedSkills
  );
  const missingSkills = extractStringArray(
    record.missingSkills ??
      record.missing_skills ??
      record.missing ??
      nestedSkills?.missing ??
      nestedSkills?.missingSkills
  );
  const recommendations = extractStringArray(
    record.recommendations ?? record.recommendation ?? record.suggestions
  );

  const scoreValue = record.score ?? record.matchScore ?? record.match_score;
  const score = typeof scoreValue === "number" ? scoreValue : Number(scoreValue);

  return {
    score: Number.isFinite(score) ? Math.min(100, Math.max(0, Math.round(score))) : 0,
    matchedSkills,
    missingSkills,
    recommendations,
  };
}

function isUsableMatchResult(result: MatchScoreResult): boolean {
  return (
    result.score > 0 ||
    result.matchedSkills.length > 0 ||
    result.missingSkills.length > 0 ||
    result.recommendations.length > 0
  );
}

function skillMatchesJd(skill: string, jdLower: string): boolean {
  const normalized = skill.toLowerCase().trim();
  if (!normalized) return false;
  if (jdLower.includes(normalized)) return true;

  const stem = normalized.replace(/\.(js|ts|tsx|jsx)$/i, "").replace(/\s+/g, "");
  const jdCompact = jdLower.replace(/\s+/g, "");
  return stem.length > 2 && jdCompact.includes(stem);
}

function mergeMatchResults(ai: MatchScoreResult, fallback: MatchScoreResult): MatchScoreResult {
  return {
    score: ai.score > 0 ? ai.score : fallback.score,
    matchedSkills: ai.matchedSkills.length > 0 ? ai.matchedSkills : fallback.matchedSkills,
    missingSkills: ai.missingSkills.length > 0 ? ai.missingSkills : fallback.missingSkills,
    recommendations: ai.recommendations.length > 0 ? ai.recommendations : fallback.recommendations,
  };
}

export const matchService = {
  async computeMatch(
    userId: string,
    resumeId: string,
    jobDescription: string,
    applicationId?: string
  ): Promise<MatchScoreResult> {
    const cacheKey = `match:v2:${resumeId}:${applicationId ?? jobDescription.slice(0, 50)}`;

    return cacheAside(cacheKey, 3600, async () => {
      const resume = await resumeRepository.findById(resumeId, userId);
      if (!resume?.profile) throw new Error("Resume profile not found. Wait for parsing to complete.");

      const profileSkills = getProfileSkills(resume.profile);
      const profileStr = JSON.stringify({
        skills: profileSkills,
        yearsOfExperience: resume.profile.yearsOfExperience,
        summary: resume.profile.summary,
      });

      const fallback = this.fallbackMatch(resume.profile, jobDescription);

      try {
        const text = await generateText(MATCH_SCORE_PROMPT(profileStr, jobDescription));
        const normalized = normalizeMatchScoreResult(parseJsonFromAI<unknown>(text));

        const result = !normalized || !isUsableMatchResult(normalized)
          ? fallback
          : mergeMatchResults(normalized, fallback);

        await usageMetricsRepository.increment(userId, "totalMatchAnalyses");
        if (applicationId) {
          await activityRepository.create({
            userId,
            applicationId,
            action: "AI_MATCH_ANALYZED",
            metadata: { score: result.score },
          });
        }

        return result;
      } catch {
        return fallback;
      }
    });
  },

  fallbackMatch(
    profile: { skills: unknown; technologies: unknown },
    jobDescription: string
  ): MatchScoreResult {
    const skills = getProfileSkills(profile);
    const jdLower = jobDescription.toLowerCase();
    const matchedSkills = skills.filter((skill) => skillMatchesJd(skill, jdLower));
    const missingSkills = skills
      .filter((skill) => !skillMatchesJd(skill, jdLower))
      .slice(0, 8);
    const score =
      skills.length > 0 ? Math.round((matchedSkills.length / skills.length) * 100) : 50;

    return {
      score,
      matchedSkills,
      missingSkills,
      recommendations: [
        "Tailor your resume to highlight relevant experience",
        "Add keywords from the job description",
        "Quantify achievements in matching areas",
      ],
    };
  },

  async getTopMatches(userId: string, resumeId: string, limit = 5) {
    const [resume, applications] = await Promise.all([
      resumeRepository.findById(resumeId, userId),
      applicationRepository.findAllForUser(userId),
    ]);

    if (!resume?.profile) return [];

    const withDescriptions = applications.filter((a) => a.jobDescription);
    const matches = await Promise.all(
      withDescriptions.slice(0, 10).map(async (app) => {
        const result = await this.computeMatch(
          userId,
          resumeId,
          app.jobDescription!,
          app.id
        );
        return { application: app, ...result };
      })
    );

    return matches.sort((a, b) => b.score - a.score).slice(0, limit);
  },
};

export const aiService = {
  async parseResumeText(rawText: string): Promise<ResumeProfileData> {
    try {
      const text = await generateText(RESUME_PARSE_PROMPT(rawText));
      return parseJsonFromAI<ResumeProfileData>(text);
    } catch {
      return {
        skills: [],
        technologies: [],
        yearsOfExperience: 0,
        education: [],
        summary: rawText.slice(0, 500),
      };
    }
  },

  async generateInterviewPrep(userId: string, applicationId: string): Promise<InterviewPrepResult> {
    const app = await applicationRepository.findById(applicationId, userId);
    if (!app) throw new Error("Not found");

    await usageMetricsRepository.increment(userId, "totalAIRequests");

    try {
      const text = await generateText(
        INTERVIEW_PREP_PROMPT(app.company, app.role, app.jobDescription ?? "")
      );
      return parseJsonFromAI<InterviewPrepResult>(text);
    } catch {
      return {
        questions: [
          { type: "behavioral", question: `Why do you want to work at ${app.company}?`, tip: "Research company values" },
          { type: "technical", question: `Describe a challenging project related to ${app.role}`, tip: "Use STAR method" },
        ],
        roadmap: ["Review job description", "Prepare 3 STAR stories", "Research company news"],
      };
    }
  },

  async *generateMessageStream(userId: string, input: GenerateMessageInput) {
    await usageMetricsRepository.increment(userId, "totalAIRequests");

    const prompt = MESSAGE_PROMPT(input.type.replace("_", " ").toLowerCase(), input.context);
    for await (const chunk of streamText(prompt)) {
      yield chunk;
    }
  },

  async generateMessage(userId: string, input: GenerateMessageInput) {
    let content = "";
    for await (const chunk of this.generateMessageStream(userId, input)) {
      content += chunk;
    }

    await aiMessageRepository.create({
      userId,
      applicationId: input.applicationId,
      type: input.type,
      content,
    });

    if (input.applicationId) {
      await activityRepository.create({
        userId,
        applicationId: input.applicationId,
        action: "MESSAGE_GENERATED",
        metadata: { type: input.type },
      });
    }

    return { content };
  },

  async generateOutreachEmail(
    userId: string,
    applicationId: string,
    resumeId?: string
  ): Promise<OutreachEmailResult> {
    const [app, user] = await Promise.all([
      applicationRepository.findById(applicationId, userId),
      userRepository.findById(userId),
    ]);
    if (!app) throw new Error("Not found");
    if (!user) throw new Error("Unauthorized");

    let resume = resumeId
      ? await resumeRepository.findById(resumeId, userId)
      : null;

    if (!resume) {
      const resumes = await resumeRepository.findMany(userId);
      resume = resumes.find((r) => r.profile && r.parseStatus === "DONE") ?? resumes[0] ?? null;
    }

    const profileStr = resume?.profile
      ? JSON.stringify({
          skills: resume.profile.skills,
          technologies: resume.profile.technologies,
          yearsOfExperience: resume.profile.yearsOfExperience,
          education: resume.profile.education,
          summary: resume.profile.summary,
        })
      : JSON.stringify({ summary: "No resume uploaded yet. Write a general outreach email." });

    await usageMetricsRepository.increment(userId, "totalAIRequests");

    const candidateName = user.name ?? "Candidate";

    try {
      const text = await generateText(
        OUTREACH_EMAIL_PROMPT(
          candidateName,
          app.company,
          app.role,
          app.location ?? "",
          app.recruiterName ?? "",
          profileStr,
          app.jobDescription ?? `${app.role} at ${app.company}`
        )
      );
      return parseJsonFromAI<OutreachEmailResult>(text);
    } catch {
      const greeting = app.recruiterName ? `Hi ${app.recruiterName},` : "Hello Hiring Team,";
      return {
        subject: `Application for ${app.role} — ${candidateName}`,
        body: `${greeting}\n\nI am writing to express my interest in the ${app.role} position at ${app.company}. My background aligns well with the role, and I would welcome the opportunity to contribute to your team.\n\nThank you for your time and consideration.\n\nBest regards,\n${candidateName}`,
      };
    }
  },
};
