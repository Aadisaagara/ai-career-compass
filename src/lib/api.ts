import { supabase } from "@/integrations/supabase/client";

const BASE = import.meta.env.VITE_API_BASE_URL as string | undefined;

export interface ProcessResumeResponse {
  matchScore: number;
  missingKeywords: string[];
  coverLetter: string;
  tailoredSummary: string;
  improvements: string[];
}

export async function processResume(payload: {
  jobDescription: string;
  resumeText: string;
}): Promise<ProcessResumeResponse> {
  if (!BASE) {
    throw new Error(
      "VITE_API_BASE_URL is not configured. Set it in your environment to your AI backend URL.",
    );
  }
  const session = await supabase.auth.getSession();
  const token = session.data.session?.access_token;
  const res = await fetch(`${BASE}/api/process-ai`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token ?? ""}`,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error((await res.text()) || `Request failed: ${res.status}`);
  return res.json();
}