import type { Request } from "express";
import type { User } from "@supabase/supabase-js";

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface AuthenticatedRequest extends Request {
  user: User;
  accessToken?: string;
}

export type JobStatus = "Saved" | "Applied" | "Interview" | "Offer";

export type GeminiResult = {
  matchScore: number;
  missingKeywords: string[];
  coverLetter: string;
  tailoredSummary: string;
  improvements: string[];
};

export type Job = {
  id: string;
  user_id: string;
  company_name: string;
  role_title: string;
  status: JobStatus;
  original_resume_text: string | null;
  job_description: string | null;
  generated_content: Json;
  created_at: string;
  updated_at: string;
};

export type Profile = {
  id: string;
  full_name: string | null;
  master_resume_text: string | null;
  avatar_url: string | null;
  updated_at: string;
};

export type Resume = {
  id: string;
  user_id: string;
  name: string;
  raw_text: string;
  is_default: boolean;
  created_at: string;
};

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      jobs: {
        Row: Job;
        Insert: {
          id?: string;
          user_id: string;
          company_name: string;
          role_title: string;
          status?: JobStatus;
          original_resume_text?: string | null;
          job_description?: string | null;
          generated_content?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Job, "id" | "created_at">>;
        Relationships: [
          {
            foreignKeyName: "jobs_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: Profile;
        Insert: {
          id: string;
          full_name?: string | null;
          master_resume_text?: string | null;
          avatar_url?: string | null;
          updated_at?: string;
        };
        Update: Partial<Omit<Profile, "id">>;
        Relationships: [];
      };
      resumes: {
        Row: Resume;
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          raw_text: string;
          is_default?: boolean;
          created_at?: string;
        };
        Update: Partial<Omit<Resume, "id" | "created_at">>;
        Relationships: [
          {
            foreignKeyName: "resumes_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      generated_resumes: {
        Row: {
          id: string;
          user_id: string;
          job_id: string | null;
          resume_id: string | null;
          sections: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          job_id?: string | null;
          resume_id?: string | null;
          sections: Json;
          created_at?: string;
        };
        Update: Partial<{
          user_id: string;
          job_id: string | null;
          resume_id: string | null;
          sections: Json;
        }>;
        Relationships: [
          {
            foreignKeyName: "generated_resumes_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

declare global {
  namespace Express {
    interface Request {
      user?: User;
      accessToken?: string;
    }
  }
}
