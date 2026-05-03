import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { z } from "zod";
import { auth } from "../middleware/auth";
import { analyzeResume } from "../services/gemini";
import { supabaseAdmin } from "../services/supabase";
import * as localDb from "../services/localDb";
import type { Json } from "../types";

const router = Router();

const generateResumeRateLimit = rateLimit({
  windowMs: 60 * 1000,
  limit: 5,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id ?? "anonymous",
  message: { error: "Too many resume generation requests. Please try again in a minute." },
});

const generateResumeSchema = z.object({
  jobDescription: z.string().trim().min(50),
  resumeText: z.string().trim().min(100),
  jobId: z.string().uuid().optional(),
  resumeId: z.string().uuid().optional(),
  candidateName: z.string().trim().min(2),
});

router.post(
  "/generate-resume",
  auth,
  generateResumeRateLimit,
  async (req, res, next) => {
    try {
      const parsed = generateResumeSchema.safeParse(req.body);

      if (!parsed.success) {
        res.status(400).json({
          error: "Invalid request body",
          details: parsed.error.flatten(),
        });
        return;
      }

      const { jobDescription, resumeText, jobId, resumeId, candidateName } =
        parsed.data;

      let generatedSections: Record<string, unknown>;

      try {
        const result = await analyzeResume(jobDescription, resumeText, candidateName);

        if (
          typeof result !== "object" ||
          result === null ||
          Array.isArray(result)
        ) {
          throw new Error("Gemini returned an unexpected response format");
        }

        generatedSections = result;
      } catch (error) {
        res.status(502).json({
          error: "AI generation failed",
          detail: error instanceof Error ? error.message : "Unknown error",
        });
        return;
      }

      const data = await localDb.insertGeneratedResume({
          user_id: req.user!.id,
          job_id: jobId ?? null,
          resume_id: resumeId ?? null,
          sections: generatedSections as Json,
      });

      res.status(200).json({
        ...(generatedSections as Record<string, unknown>),
        id: data?.id,
      });
    } catch (error) {
      next(error);
    }
  },
);

export default router;
