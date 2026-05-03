import { supabase } from "@/integrations/supabase/client";

const BASE = import.meta.env.VITE_API_BASE_URL as string | undefined;

export interface ProcessResumeResponse {
  matchScore: number;
  missingKeywords: string[];
  coverLetter: string;
  tailoredSummary: string;
  improvements: string[];
}

export interface Resume {
  id: string;
  user_id: string;
  name: string;
  raw_text: string;
  file_url: string | null;
  is_default: boolean;
  created_at: string;
}

export interface TailoredResumeResponse {
  atsMatchScore: number;
  keywordsAdded: number;
  contactHeader: {
    name: string;
    email: string;
    phone: string;
    location: string;
    linkedin?: string;
  };
  professionalSummary: string;
  coreCompetencies: string[];
  workExperience: Array<{
    company: string;
    title: string;
    duration: string;
    bullets: string[];
  }>;
  education: Array<{
    institution: string;
    degree: string;
    year: string;
  }>;
  certifications: string[];
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

  if (!token) {
    throw new Error("You must be signed in before using the AI resume tools.");
  }

  const res = await fetch(`${BASE}/api/process-ai`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error((await res.text()) || `Request failed: ${res.status}`);
  return res.json();
}

export async function fetchResumes(): Promise<Resume[]> {
  if (!BASE) {
    throw new Error("VITE_API_BASE_URL is not configured.");
  }
  const session = await supabase.auth.getSession();
  const token = session.data.session?.access_token;

  if (!token) {
    throw new Error("You must be signed in to fetch resumes.");
  }

  const res = await fetch(`${BASE}/api/resumes`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error((await res.text()) || `Request failed: ${res.status}`);
  return res.json();
}

export async function saveResume(payload: {
  name: string;
  raw_text: string;
  is_default: boolean;
}): Promise<Resume> {
  if (!BASE) {
    throw new Error("VITE_API_BASE_URL is not configured.");
  }
  const session = await supabase.auth.getSession();
  const token = session.data.session?.access_token;

  if (!token) {
    throw new Error("You must be signed in to save resumes.");
  }

  const res = await fetch(`${BASE}/api/resumes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error((await res.text()) || `Request failed: ${res.status}`);
  return res.json();
}

export async function setDefaultResume(resumeId: string): Promise<Resume> {
  if (!BASE) {
    throw new Error("VITE_API_BASE_URL is not configured.");
  }
  const session = await supabase.auth.getSession();
  const token = session.data.session?.access_token;

  if (!token) {
    throw new Error("You must be signed in to update resumes.");
  }

  const res = await fetch(`${BASE}/api/resumes/${resumeId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ is_default: true }),
  });
  if (!res.ok) throw new Error((await res.text()) || `Request failed: ${res.status}`);
  return res.json();
}

export async function updateResume(resumeId: string, payload: { name?: string; raw_text?: string; is_default?: boolean }): Promise<Resume> {
  if (!BASE) {
    throw new Error("VITE_API_BASE_URL is not configured.");
  }
  const session = await supabase.auth.getSession();
  const token = session.data.session?.access_token;

  if (!token) {
    throw new Error("You must be signed in to update resumes.");
  }

  const res = await fetch(`${BASE}/api/resumes/${resumeId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error((await res.text()) || `Request failed: ${res.status}`);
  return res.json();
}

export async function deleteResume(resumeId: string): Promise<void> {
  if (!BASE) {
    throw new Error("VITE_API_BASE_URL is not configured.");
  }
  const session = await supabase.auth.getSession();
  const token = session.data.session?.access_token;

  if (!token) {
    throw new Error("You must be signed in to delete resumes.");
  }

  const res = await fetch(`${BASE}/api/resumes/${resumeId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error((await res.text()) || `Request failed: ${res.status}`);
}

export async function generateTailoredResume(payload: {
  jobDescription: string;
  resumeText: string;
  jobId?: string;
  resumeId?: string;
  candidateName: string;
}): Promise<TailoredResumeResponse> {
  if (!BASE) {
    throw new Error("VITE_API_BASE_URL is not configured.");
  }
  const session = await supabase.auth.getSession();
  const token = session.data.session?.access_token;

  if (!token) {
    throw new Error("You must be signed in to generate tailored resumes.");
  }

  const res = await fetch(`${BASE}/api/generate-resume`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error((await res.text()) || `Request failed: ${res.status}`);
  return res.json();
}
