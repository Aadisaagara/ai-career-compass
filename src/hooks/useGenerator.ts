import { useState } from "react";
import { processResume, type ProcessResumeResponse } from "@/lib/api";
import { toast } from "sonner";

export function useGenerator() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ProcessResumeResponse | null>(null);

  async function run(payload: { jobDescription: string; resumeText: string }) {
    setLoading(true);
    try {
      const r = await processResume(payload);
      setResult(r);
      toast.success("Analysis complete");
      return r;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to analyze");
      return null;
    } finally {
      setLoading(false);
    }
  }

  return { loading, result, setResult, run };
}