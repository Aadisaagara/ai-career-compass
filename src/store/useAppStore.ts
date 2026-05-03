import { create } from "zustand";
import type { Session, User } from "@supabase/supabase-js";

export type JobStatus = "Saved" | "Applied" | "Interview" | "Offer";

export interface Job {
  id: string;
  user_id: string;
  company_name: string;
  role_title: string;
  status: JobStatus;
  original_resume_text: string | null;
  job_description: string | null;
  generated_content: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  full_name: string | null;
  master_resume_text: string | null;
  avatar_url: string | null;
  updated_at: string;
}

interface AppState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  jobs: Job[];
  theme: "light" | "dark";
  authReady: boolean;
  setAuth: (user: User | null, session: Session | null) => void;
  setProfile: (p: Profile | null) => void;
  setJobs: (j: Job[]) => void;
  upsertJob: (j: Job) => void;
  removeJob: (id: string) => void;
  setTheme: (t: "light" | "dark") => void;
  setAuthReady: (b: boolean) => void;
}

const initialTheme: "light" | "dark" =
  typeof window !== "undefined" && localStorage.getItem("theme") === "dark" ? "dark" : "light";

if (typeof window !== "undefined") {
  document.documentElement.classList.toggle("dark", initialTheme === "dark");
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  session: null,
  profile: null,
  jobs: [],
  theme: initialTheme,
  authReady: false,
  setAuth: (user, session) => set({ user, session }),
  setProfile: (profile) => set({ profile }),
  setJobs: (jobs) => set({ jobs }),
  upsertJob: (job) =>
    set((s) => {
      const i = s.jobs.findIndex((j) => j.id === job.id);
      if (i === -1) return { jobs: [job, ...s.jobs] };
      const next = [...s.jobs];
      next[i] = job;
      return { jobs: next };
    }),
  removeJob: (id) => set((s) => ({ jobs: s.jobs.filter((j) => j.id !== id) })),
  setTheme: (theme) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("theme", theme);
      document.documentElement.classList.toggle("dark", theme === "dark");
    }
    set({ theme });
  },
  setAuthReady: (authReady) => set({ authReady }),
}));