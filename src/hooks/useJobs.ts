import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAppStore, type Job, type JobStatus } from "@/store/useAppStore";
import { toast } from "sonner";

export function useJobs() {
  const user = useAppStore((s) => s.user);
  const jobs = useAppStore((s) => s.jobs);
  const setJobs = useAppStore((s) => s.setJobs);
  const upsertJob = useAppStore((s) => s.upsertJob);
  const removeJob = useAppStore((s) => s.removeJob);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let mounted = true;
    setLoading(true);
    supabase
      .from("jobs")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (!mounted) return;
        if (error) toast.error(error.message);
        else setJobs((data ?? []) as unknown as Job[]);
        setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [user, setJobs]);

  async function createJob(input: {
    company_name: string;
    role_title: string;
    job_description?: string;
    status?: JobStatus;
  }) {
    if (!user) return;
    const { data, error } = await supabase
      .from("jobs")
      .insert({
        user_id: user.id,
        company_name: input.company_name,
        role_title: input.role_title,
        job_description: input.job_description ?? null,
        status: input.status ?? "Saved",
      })
      .select()
      .single();
    if (error) {
      toast.error(error.message);
      return null;
    }
    upsertJob(data as unknown as Job);
    toast.success("Job added");
    return data as unknown as Job;
  }

  async function updateJob(id: string, patch: Partial<Job>) {
    const prev = jobs.find((j) => j.id === id);
    if (prev) upsertJob({ ...prev, ...patch } as Job);
    const { data, error } = await supabase
      .from("jobs")
      .update(patch as never)
      .eq("id", id)
      .select()
      .single();
    if (error) {
      toast.error(error.message);
      if (prev) upsertJob(prev);
      return null;
    }
    upsertJob(data as unknown as Job);
    return data as unknown as Job;
  }

  async function deleteJob(id: string) {
    const prev = jobs.find((j) => j.id === id);
    removeJob(id);
    const { error } = await supabase.from("jobs").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      if (prev) upsertJob(prev);
      return false;
    }
    toast.success("Job deleted");
    return true;
  }

  return { jobs, loading, createJob, updateJob, deleteJob };
}