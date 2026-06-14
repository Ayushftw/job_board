import {
  generateText,
  streamText,
  parseJsonFromAI,
  MATCH_SCORE_PROMPT,
  INTERVIEW_PREP_PROMPT,
  MESSAGE_PROMPT,
  RESUME_PARSE_PROMPT,
} from "@/lib/gemini";
import { resumeRepository } from "@/repositories/resume.repository";
import { applicationRepository } from "@/repositories/application.repository";
import {
  aiMessageRepository,
  activityRepository,
  usageMetricsRepository,
} from "@/repositories/activity.repository";
import { cacheAside } from "@/lib/redis";
import type { MatchScoreResult, InterviewPrepResult, ResumeProfileData } from "@/types";
import type { GenerateMessageInput } from "@/dto/ai.dto";

export const matchService = {
  async computeMatch(
    userId: string,
    resumeId: string,
    jobDescription: string,
    applicationId?: string
  ): Promise<MatchScoreResult> {
    const cacheKey = `match:${resumeId}:${applicationId ?? jobDescription.slice(0, 50)}`;

    return cacheAside(cacheKey, 3600, async () => {
      const resume = await resumeRepository.findById(resumeId, userId);
      if (!resume?.profile) throw new Error("Resume profile not found. Wait for parsing to complete.");

      const profileStr = JSON.stringify({
        skills: resume.profile.skills,
        technologies: resume.profile.technologies,
        yearsOfExperience: resume.profile.yearsOfExperience,
        summary: resume.profile.summary,
      });

      try {
        const text = await generateText(MATCH_SCORE_PROMPT(profileStr, jobDescription));
        const result = parseJsonFromAI<MatchScoreResult>(text);

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
        return this.fallbackMatch(resume.profile, jobDescription);
      }
    });
  },

  fallbackMatch(
    profile: { skills: unknown; technologies: unknown },
    jobDescription: string
  ): MatchScoreResult {
    const skills = [
      ...(Array.isArray(profile.skills) ? (profile.skills as string[]) : []),
      ...(Array.isArray(profile.technologies) ? (profile.technologies as string[]) : []),
    ];
    const jdLower = jobDescription.toLowerCase();
    const matchedSkills = skills.filter((s) => jdLower.includes(s.toLowerCase()));
    const missingSkills = skills.filter((s) => !jdLower.includes(s.toLowerCase())).slice(0, 5);
    const score = skills.length > 0 ? Math.round((matchedSkills.length / skills.length) * 100) : 50;

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
};
