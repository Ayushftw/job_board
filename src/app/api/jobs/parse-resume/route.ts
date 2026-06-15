import { NextRequest } from "next/server";
import { createRequire } from "node:module";
import { Receiver } from "@upstash/qstash";
import { resumeRepository } from "@/repositories/resume.repository";
import { resumeService } from "@/services/resume.service";
import { aiService } from "@/services/match.service";
import type { ParseResumeJob } from "@/lib/queue";
import { apiSuccess, apiError } from "@/lib/api";

async function verifyQStash(request: NextRequest, body: string) {
  const currentKey = process.env.QSTASH_CURRENT_SIGNING_KEY;
  if (!currentKey) return true;

  const receiver = new Receiver({
    currentSigningKey: currentKey,
    nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY ?? "",
  });

  const signature = request.headers.get("upstash-signature");
  if (!signature) return false;

  return receiver.verify({ signature, body });
}

async function extractPdfText(buffer: Buffer): Promise<string> {
  const require = createRequire(import.meta.url);
  const pdfParse = require("pdf-parse") as (buf: Buffer) => Promise<{ text: string }>;
  const parsed = await pdfParse(buffer);
  return parsed.text;
}

export async function POST(request: NextRequest) {
  const bodyText = await request.text();
  const verified = await verifyQStash(request, bodyText);
  if (!verified) return apiError("Invalid signature", 401);

  const payload = JSON.parse(bodyText) as ParseResumeJob;
  const { resumeId, fileUrl } = payload;

  try {
    await resumeRepository.updateParseStatus(resumeId, "PROCESSING");

    const response = await fetch(fileUrl);
    const buffer = Buffer.from(await response.arrayBuffer());
    const rawText = await extractPdfText(buffer);

    const profile = await aiService.parseResumeText(rawText);
    await resumeService.saveParsedProfile(resumeId, profile, rawText);

    return apiSuccess({ success: true, resumeId });
  } catch (error) {
    await resumeRepository.updateParseStatus(resumeId, "FAILED");
    console.error("Parse resume failed:", error);
    return apiError("Parse failed", 500);
  }
}
