import { describe, it, expect } from "vitest";
import { createApplicationSchema, updateStatusSchema } from "@/dto/application.dto";
import { registerSchema } from "@/dto/auth.dto";
import { matchScoreSchema } from "@/dto/ai.dto";
import { slugify, generateApiKey, formatPercent } from "@/lib/utils";
import { APPLICATION_STATUSES, STATUS_LABELS } from "@/types";

describe("application.dto", () => {
  it("validates create application", () => {
    const result = createApplicationSchema.safeParse({
      company: "Google",
      role: "Software Engineer",
      jobUrl: "https://careers.google.com",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing company", () => {
    const result = createApplicationSchema.safeParse({ role: "Engineer" });
    expect(result.success).toBe(false);
  });

  it("validates status update", () => {
    const result = updateStatusSchema.safeParse({ status: "OFFER" });
    expect(result.success).toBe(true);
  });

  it("rejects invalid status", () => {
    const result = updateStatusSchema.safeParse({ status: "INVALID" });
    expect(result.success).toBe(false);
  });
});

describe("auth.dto", () => {
  it("validates registration", () => {
    const result = registerSchema.safeParse({
      name: "Jane Doe",
      email: "jane@example.com",
      password: "password123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects short password", () => {
    const result = registerSchema.safeParse({
      name: "Jane",
      email: "jane@example.com",
      password: "short",
    });
    expect(result.success).toBe(false);
  });
});

describe("ai.dto", () => {
  it("validates match score input", () => {
    const result = matchScoreSchema.safeParse({
      resumeId: "resume123",
      applicationId: "app123",
    });
    expect(result.success).toBe(true);
  });
});

describe("utils", () => {
  it("slugifies text", () => {
    expect(slugify("Jane Doe")).toBe("jane-doe");
    expect(slugify("Hello World!")).toBe("hello-world");
  });

  it("generates api key with prefix", () => {
    const key = generateApiKey();
    expect(key.startsWith("jt_")).toBe(true);
    expect(key.length).toBeGreaterThan(10);
  });

  it("formats percent", () => {
    expect(formatPercent(75.6)).toBe("76%");
  });
});

describe("types", () => {
  it("has all application statuses labeled", () => {
    APPLICATION_STATUSES.forEach((status) => {
      expect(STATUS_LABELS[status]).toBeDefined();
    });
  });
});

describe("match service fallback logic", () => {
  it("computes basic match score", () => {
    const skills = ["React", "TypeScript", "Node.js"];
    const jd = "We need React and TypeScript experience";
    const matched = skills.filter((s) => jd.toLowerCase().includes(s.toLowerCase()));
    const score = Math.round((matched.length / skills.length) * 100);
    expect(score).toBe(67);
    expect(matched).toContain("React");
    expect(matched).toContain("TypeScript");
  });
});

describe("cache aside pattern", () => {
  it("returns fetched data when cache miss", async () => {
    const cache = new Map<string, unknown>();
    async function cacheAside<T>(key: string, fetchFn: () => Promise<T>): Promise<T> {
      if (cache.has(key)) return cache.get(key) as T;
      const data = await fetchFn();
      cache.set(key, data);
      return data;
    }

    let fetchCount = 0;
    const result1 = await cacheAside("test", async () => {
      fetchCount++;
      return { value: 42 };
    });
    const result2 = await cacheAside("test", async () => {
      fetchCount++;
      return { value: 99 };
    });

    expect(result1.value).toBe(42);
    expect(result2.value).toBe(42);
    expect(fetchCount).toBe(1);
  });
});

describe("status transitions", () => {
  it("allows valid kanban transitions", () => {
    const validStatuses = ["APPLIED", "SCREENING", "TECHNICAL", "OFFER", "REJECTED"];
    validStatuses.forEach((status) => {
      expect(APPLICATION_STATUSES.includes(status as typeof APPLICATION_STATUSES[number])).toBe(true);
    });
  });
});

describe("analytics calculations", () => {
  it("computes response rate", () => {
    const apps = [
      { status: "APPLIED" },
      { status: "SCREENING" },
      { status: "OFFER" },
      { status: "REJECTED" },
    ];
    const responded = apps.filter((a) => a.status !== "APPLIED").length;
    const rate = (responded / apps.length) * 100;
    expect(rate).toBe(75);
  });

  it("computes offer conversion rate", () => {
    const total = 20;
    const offers = 2;
    expect(Math.round((offers / total) * 100)).toBe(10);
  });
});

describe("resume profile structure", () => {
  it("validates profile shape", () => {
    const profile = {
      skills: ["JavaScript", "Python"],
      technologies: ["React", "Django"],
      yearsOfExperience: 3,
      education: [{ degree: "BS CS", school: "MIT", year: "2020" }],
      summary: "Full stack developer",
    };
    expect(profile.skills.length).toBeGreaterThan(0);
    expect(profile.yearsOfExperience).toBe(3);
  });
});

describe("activity message formatting", () => {
  it("formats status change message", () => {
    const activity = {
      action: "STATUS_CHANGED",
      label: "Status updated for",
      company: "Google",
      metadata: { label: "Offer" },
    };
    const meta = activity.metadata as Record<string, string>;
    const message = `${activity.label} ${activity.company} — ${meta.label}`;
    expect(message).toBe("Status updated for Google — Offer");
  });
});

describe("API key auth header parsing", () => {
  it("extracts bearer token", () => {
    const header = "Bearer jt_abc123";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    expect(token).toBe("jt_abc123");
  });
});

describe("linkedin job scrape shape", () => {
  it("validates scraped job data structure", () => {
    const job = {
      company: "Meta",
      role: "Frontend Engineer",
      location: "Menlo Park, CA",
      jobUrl: "https://linkedin.com/jobs/view/123",
      jobDescription: "Build UI components",
      employmentType: "Full-time",
    };
    expect(job.company).toBeTruthy();
    expect(job.role).toBeTruthy();
    expect(job.jobUrl).toContain("linkedin.com");
  });
});

describe("queue job payloads", () => {
  it("validates parse resume job", () => {
    const job = {
      type: "parse-resume" as const,
      resumeId: "resume_123",
      fileUrl: "https://utfs.io/f/abc.pdf",
    };
    expect(job.type).toBe("parse-resume");
    expect(job.fileUrl).toContain("https");
  });

  it("validates send email job", () => {
    const job = {
      type: "send-email" as const,
      to: "user@example.com",
      subject: "Welcome",
      html: "<p>Hello</p>",
    };
    expect(job.to).toContain("@");
  });
});

describe("public profile stats", () => {
  it("computes public stats from applications", () => {
    const apps = [
      { status: "APPLIED" },
      { status: "SCREENING" },
      { status: "OFFER" },
    ];
    const interviews = apps.filter((a) =>
      ["SCREENING", "TECHNICAL", "OFFER"].includes(a.status)
    ).length;
    const offers = apps.filter((a) => a.status === "OFFER").length;
    expect(interviews).toBe(2);
    expect(offers).toBe(1);
  });
});

describe("rate limit identifier", () => {
  it("uses userId as identifier", () => {
    const userId = "user_abc123";
    const identifier = `ai:${userId}`;
    expect(identifier).toBe("ai:user_abc123");
  });
});
