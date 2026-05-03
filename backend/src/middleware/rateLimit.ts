import { rateLimit } from "express-rate-limit";

export const aiRateLimit = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id ?? "anonymous",
  message: { error: "Too many AI requests. Please try again in a minute." },
});
