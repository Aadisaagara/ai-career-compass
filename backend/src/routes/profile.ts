import { Router } from "express";
import { z } from "zod";
import { auth } from "../middleware/auth";
import { getSupabase } from "../services/supabase";

const router = Router();

const updateProfileSchema = z
  .object({
    full_name: z.string().trim().min(1).max(200).nullable().optional(),
    master_resume_text: z.string().nullable().optional(),
    avatar_url: z.string().url().nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
  });

router.get("/profile", auth, async (req, res, next) => {
  try {
    const { data, error } = await getSupabase(req.accessToken)
      .from("profiles")
      .select("*")
      .eq("id", req.user!.id)
      .maybeSingle();

    if (error) {
      next(error);
      return;
    }

    res.json({ profile: data ?? null });
  } catch (error) {
    next(error);
  }
});

router.put("/profile", auth, async (req, res, next) => {
  try {
    const parsed = updateProfileSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        error: "Invalid request body",
        details: parsed.error.flatten(),
      });
      return;
    }

    const { data, error } = await getSupabase(req.accessToken)
      .from("profiles")
      .upsert({
        id: req.user!.id,
        ...parsed.data,
      })
      .select()
      .single();

    if (error) {
      next(error);
      return;
    }

    res.json({ profile: data });
  } catch (error) {
    next(error);
  }
});

export default router;
