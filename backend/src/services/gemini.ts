import { GoogleGenerativeAI } from "@google/generative-ai";
import type { GeminiResult } from "../types";
import { getRequiredEnv } from "./env";

let genAI: GoogleGenerativeAI | null = null;

function getGeminiClient(): GoogleGenerativeAI {
  genAI ??= new GoogleGenerativeAI(getRequiredEnv("GEMINI_API_KEY"));
  return genAI;
}

function parseJsonResponse(text: string): GeminiResult {
  try {
    return JSON.parse(text) as GeminiResult;
  } catch {
    const jsonMatch = text.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error("Gemini response did not contain valid JSON");
    }

    return JSON.parse(jsonMatch[0]) as GeminiResult;
  }
}

export async function analyzeResume(
  jobDescription: string,
  resumeText: string,
): Promise<GeminiResult> {
  const model = getGeminiClient().getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: { responseMimeType: "application/json" },
  });

  const prompt = `
You are an expert ATS optimization specialist and career coach.

JOB DESCRIPTION:
${jobDescription}

CANDIDATE RESUME:
${resumeText}

Analyze the resume against the job description and respond with ONLY valid JSON in this exact schema:
{
  "matchScore": <integer 0-100>,
  "missingKeywords": [<string>, ...],
  "coverLetter": "<3-paragraph professional cover letter that incorporates missing keywords naturally>",
  "tailoredSummary": "<4-sentence ATS-optimized professional summary>",
  "improvements": ["<specific actionable tip>", "<specific actionable tip>", "<specific actionable tip>"]
}
`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  return parseJsonResponse(text);
}
