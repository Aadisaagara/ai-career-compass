import { GoogleGenerativeAI } from "@google/generative-ai";
import type { GeminiResult } from "../types";
import { getRequiredEnv } from "./env";

let genAI: GoogleGenerativeAI | null = null;

function getGeminiClient(): GoogleGenerativeAI {
  genAI ??= new GoogleGenerativeAI(getRequiredEnv("GEMINI_API_KEY"));
  return genAI;
}

function parseJsonResponse<T>(text: string): T {
  try {
    return JSON.parse(text) as T;
  } catch {
    const jsonMatch = text.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error("Gemini response did not contain valid JSON");
    }

    return JSON.parse(jsonMatch[0]) as T;
  }
}

export async function analyzeResume(
  jobDescription: string,
  resumeText: string,
  candidateName?: string,
): Promise<GeminiResult | Record<string, unknown>> {
  const isResumeGeneration = Boolean(candidateName?.trim());
  const model = getGeminiClient().getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: { responseMimeType: "application/json" },
  });

  const prompt = isResumeGeneration
    ? `You are an expert resume writer and ATS optimization specialist with 15 years experience.

CANDIDATE NAME: ${candidateName}

JOB DESCRIPTION:
${jobDescription}

BASE RESUME:
${resumeText}

Create a complete ATS-optimized tailored resume for this specific job.
Respond ONLY in this exact JSON structure:

{
  'contactHeader': {
    'name': string,
    'email': '[extract from resume or leave blank]',
    'phone': '[extract from resume or leave blank]',
    'linkedin': '[extract from resume or leave blank]',
    'location': '[extract from resume or leave blank]'
  },
  'professionalSummary': 'string — 4 sentences, keyword-rich, tailored to this JD',
  'coreCompetencies': ['skill1', 'skill2', ... up to 12 skills from JD and resume],
  'workExperience': [
    {
      'company': string,
      'title': string,
      'duration': string,
      'bullets': ['achievement 1 with metrics', 'achievement 2', 'achievement 3']
    }
  ],
  'education': [
    {
      'institution': string,
      'degree': string,
      'year': string
    }
  ],
  'certifications': ['cert1', 'cert2'],
  'atsKeywordsAdded': ['keyword1', 'keyword2', ...],
  'matchScoreEstimate': number 0-100
}`
    : `You are an expert ATS optimization specialist and career coach.

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

  return isResumeGeneration
    ? parseJsonResponse<Record<string, unknown>>(text)
    : parseJsonResponse<GeminiResult>(text);
}
