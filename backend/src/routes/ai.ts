import { Router } from "express";
import { z } from "zod";
import { aiRateLimit } from "../middleware/rateLimit";
import { auth } from "../middleware/auth";
import { analyzeResume } from "../services/gemini";
import { getSupabase } from "../services/supabase";
import type { Json } from "../types";

const router = Router();

const processAiSchema = z.object({
  jobDescription: z.string().trim().min(50),
  resumeText: z.string().trim().min(100),
  jobId: z.string().uuid().optional(),
});

router.post("/process-ai", auth, aiRateLimit, async (req, res, next) => {
  try {
    const parsed = processAiSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        error: "Invalid request body",
        details: parsed.error.flatten(),
      });
      return;
    }

    const { jobDescription, resumeText, jobId } = parsed.data;

    let result;

    try {
      result = await analyzeResume(jobDescription, resumeText);
    } catch (error) {
      console.error("Gemini analysis failed:", error);
      res.status(502).json({ error: "AI service unavailable" });
      return;
    }

    if (jobId) {
      const { data: existingJob, error: lookupError } = await getSupabase(
        req.accessToken,
      )
        .from("jobs")
        .select("id")
        .eq("id", jobId)
        .eq("user_id", req.user!.id)
        .maybeSingle();

      if (lookupError) {
        next(lookupError);
        return;
      }

      if (!existingJob) {
        res.status(404).json({ error: "Job not found" });
        return;
      }

      const { error: updateError } = await getSupabase(req.accessToken)
        .from("jobs")
        .update({
          generated_content: result as Json,
          job_description: jobDescription,
          original_resume_text: resumeText,
        })
        .eq("id", jobId)
        .eq("user_id", req.user!.id);

      if (updateError) {
        next(updateError);
        return;
      }
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
