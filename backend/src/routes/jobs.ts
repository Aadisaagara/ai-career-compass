import { Router } from "express";
import { z } from "zod";
import { auth } from "../middleware/auth";
import { getSupabase } from "../services/supabase";
import type { Json } from "../types";

const router = Router();

const jobStatusSchema = z.enum(["Saved", "Applied", "Interview", "Offer"]);

const jsonSchema: z.ZodType<Json> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(jsonSchema),
    z.record(jsonSchema),
  ]),
);

const createJobSchema = z.object({
  company_name: z.string().trim().min(1).max(200),
  role_title: z.string().trim().min(1).max(200),
  status: jobStatusSchema.optional(),
  original_resume_text: z.string().nullable().optional(),
  job_description: z.string().nullable().optional(),
  generated_content: jsonSchema.optional(),
});

const updateJobSchema = createJobSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  "At least one field is required",
);

async function ensureJobOwnership(
  id: string,
  userId: string,
  accessToken?: string,
): Promise<boolean> {
  const { data, error } = await getSupabase(accessToken)
    .from("jobs")
    .select("id")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return Boolean(data);
}

router.get("/jobs", auth, async (req, res, next) => {
  try {
    const { data, error } = await getSupabase(req.accessToken)
      .from("jobs")
      .select("*")
      .eq("user_id", req.user!.id)
      .order("created_at", { ascending: false });

    if (error) {
      next(error);
      return;
    }

    res.json({ jobs: data ?? [] });
  } catch (error) {
    next(error);
  }
});

router.post("/jobs", auth, async (req, res, next) => {
  try {
    const parsed = createJobSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        error: "Invalid request body",
        details: parsed.error.flatten(),
      });
      return;
    }

    const { data, error } = await getSupabase(req.accessToken)
      .from("jobs")
      .insert({
        ...parsed.data,
        user_id: req.user!.id,
      })
      .select()
      .single();

    if (error) {
      next(error);
      return;
    }

    res.status(201).json({ job: data });
  } catch (error) {
    next(error);
  }
});

router.put("/jobs/:id", auth, async (req, res, next) => {
  try {
    const id = z.string().uuid().parse(req.params.id);
    const parsed = updateJobSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        error: "Invalid request body",
        details: parsed.error.flatten(),
      });
      return;
    }

    if (!(await ensureJobOwnership(id, req.user!.id, req.accessToken))) {
      res.status(404).json({ error: "Job not found" });
      return;
    }

    const { data, error } = await getSupabase(req.accessToken)
      .from("jobs")
      .update(parsed.data)
      .eq("id", id)
      .eq("user_id", req.user!.id)
      .select()
      .single();

    if (error) {
      next(error);
      return;
    }

    res.json({ job: data });
  } catch (error) {
    next(error);
  }
});

router.delete("/jobs/:id", auth, async (req, res, next) => {
  try {
    const id = z.string().uuid().parse(req.params.id);

    if (!(await ensureJobOwnership(id, req.user!.id, req.accessToken))) {
      res.status(404).json({ error: "Job not found" });
      return;
    }

    const { error } = await getSupabase(req.accessToken)
      .from("jobs")
      .delete()
      .eq("id", id)
      .eq("user_id", req.user!.id);

    if (error) {
      next(error);
      return;
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
