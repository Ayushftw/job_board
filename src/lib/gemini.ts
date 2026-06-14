import { GoogleGenerativeAI } from "@google/generative-ai";

let genAI: GoogleGenerativeAI | null = null;

export function getGemini() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured");
  }
  if (!genAI) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return genAI;
}

export function getModel() {
  return getGemini().getGenerativeModel({ model: "gemini-1.5-flash" });
}

export async function generateText(prompt: string): Promise<string> {
  const model = getModel();
  const result = await model.generateContent(prompt);
  return result.response.text();
}

export async function* streamText(prompt: string) {
  const model = getModel();
  const result = await model.generateContentStream(prompt);
  for await (const chunk of result.stream) {
    const text = chunk.text();
    if (text) yield text;
  }
}

export function parseJsonFromAI<T>(text: string): T {
  const jsonMatch = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error("Failed to parse AI response as JSON");
  return JSON.parse(jsonMatch[0]) as T;
}

export const RESUME_PARSE_PROMPT = (rawText: string) => `
Extract structured data from this resume text. Return ONLY valid JSON with this shape:
{
  "skills": ["skill1", "skill2"],
  "technologies": ["tech1", "tech2"],
  "yearsOfExperience": 3,
  "education": [{"degree": "BS Computer Science", "school": "University", "year": "2020"}],
  "summary": "Brief professional summary"
}

Resume text:
${rawText.slice(0, 15000)}
`;

export const MATCH_SCORE_PROMPT = (
  resumeProfile: string,
  jobDescription: string
) => `
Compare this resume profile against the job description. Return ONLY valid JSON:
{
  "score": 75,
  "matchedSkills": ["skill1"],
  "missingSkills": ["skill2"],
  "recommendations": ["recommendation1"]
}

Resume Profile:
${resumeProfile}

Job Description:
${jobDescription.slice(0, 8000)}
`;

export const INTERVIEW_PREP_PROMPT = (
  company: string,
  role: string,
  jobDescription: string
) => `
Generate interview preparation for ${role} at ${company}. Return ONLY valid JSON:
{
  "questions": [
    {"type": "behavioral", "question": "...", "tip": "..."},
    {"type": "technical", "question": "...", "tip": "..."}
  ],
  "roadmap": ["Step 1: ...", "Step 2: ..."]
}

Job Description:
${jobDescription?.slice(0, 5000) ?? "General role preparation"}
`;

export const MESSAGE_PROMPT = (
  type: string,
  context: string
) => `
Generate a professional ${type} message. Return ONLY the message text, no JSON.
Context: ${context}
`;
