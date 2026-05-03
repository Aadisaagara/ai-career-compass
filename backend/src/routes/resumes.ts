import { Router } from "express";
import type { NextFunction, Request, Response } from "express";
import multer from "multer";
import pdfParse from "pdf-parse";
import { z } from "zod";
import { auth } from "../middleware/auth";
import { supabaseAdmin } from "../services/supabase";
import * as localDb from "../services/localDb";


const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter(_, file, cb) {
    if (file.mimetype !== "application/pdf") {
      cb(new Error("Only PDF files are allowed") as any, false);
      return;
    }

    cb(null, true);
  },
});

function handleMulterUpload(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  upload.single("resume")(req, res, (error) => {
    if (!error) {
      next();
      return;
    }

    if (error instanceof multer.MulterError) {
      let message = "File upload error";

      if (error.code === "LIMIT_FILE_SIZE") {
        message = "File size must be 5MB or smaller";
      }

      res.status(400).json({ error: message });
      return;
    }

    res.status(400).json({ error: error.message ?? "Invalid resume upload" });
  });
}

const createResumeSchema = z.object({
  name: z.string().trim().min(2).max(80),
  raw_text: z.string().min(100),
  is_default: z.boolean().optional().default(false),
});

const updateResumeSchema = z
  .object({
    name: z.string().trim().min(2).max(80).optional(),
    raw_text: z.string().min(10).optional(),
    is_default: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
  });

function normalizeText(text: string): string {
  return text
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .split("\n")
    .map((line) => line.trim())
    .join("\n")
    .replace(/ {2,}/g, " ")
    .trim();
}

router.post(
  "/parse-pdf",
  auth,
  handleMulterUpload,
  async (req, res, next) => {
    try {
      const file = req.file;

      if (!file || !file.buffer) {
        res.status(400).json({ error: "A PDF resume file is required" });
        return;
      }

      const parsed = await (pdfParse as any)(file.buffer);

      const text = String(parsed.text ?? "");
      const cleanedText = normalizeText(text);

      res.status(200).json({
        text: cleanedText,
        pageCount: parsed.numpages ?? 0,
        charCount: cleanedText.length,
      });
    } catch (error) {
      res.status(400).json({
        error:
          error instanceof Error
            ? `PDF parse failed: ${error.message}`
            : "PDF parse failed",
      });
    }
  },
);

router.get(
  "/resumes",
  auth,
  async (req, res, next) => {
    try {
      const data = await localDb.getResumes(req.user!.id);

      res.status(200).json(data ?? []);
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  "/resumes",
  auth,
  async (req, res, next) => {
    try {
      const parsed = createResumeSchema.safeParse(req.body);

      if (!parsed.success) {
        res.status(400).json({
          error: "Invalid request body",
          details: parsed.error.flatten(),
        });
        return;
      }

      const { name, raw_text, is_default } = parsed.data;

      if (is_default) {
        await localDb.resetDefaultResume(req.user!.id);
      }

      const data = await localDb.insertResume({
          user_id: req.user!.id,
          name,
          raw_text,
          is_default,
      });

      res.status(201).json(data);
    } catch (error) {
      next(error);
    }
  },
);

router.put(
  "/resumes/:id",
  auth,
  async (req, res, next) => {
    try {
      const id = z.string().min(1).parse(req.params.id);
      const parsed = updateResumeSchema.safeParse(req.body);

      if (!parsed.success) {
        res.status(400).json({
          error: "Invalid request body",
          details: parsed.error.flatten(),
        });
        return;
      }

      if (parsed.data.is_default) {
        await localDb.resetDefaultResume(req.user!.id);
      }

      const data = await localDb.updateResume(id, req.user!.id, parsed.data);

      if (!data) {
        res.status(404).json({ error: "Resume not found" });
        return;
      }

      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  },
);

router.delete(
  "/resumes/:id",
  auth,
  async (req, res, next) => {
    try {
      const id = z.string().min(1).parse(req.params.id);

      const data = await localDb.deleteResume(id, req.user!.id);

      if (!data) {
        res.status(404).json({ error: "Resume not found" });
        return;
      }

      res.status(200).json({ message: "Resume deleted" });
    } catch (error) {
      next(error);
    }
  },
);

export default router;
