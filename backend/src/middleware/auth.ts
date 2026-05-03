import type { NextFunction, Request, Response } from "express";
import { getSupabase } from "../services/supabase";

function getBearerToken(authorizationHeader?: string): string | null {
  if (!authorizationHeader) {
    return null;
  }

  const [scheme, token] = authorizationHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    return null;
  }

  return token;
}

export async function auth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const token = getBearerToken(req.header("authorization"));

    if (!token) {
      res.status(401).json({ error: "Missing bearer token" });
      return;
    }

    const { data, error } = await getSupabase(token).auth.getUser(token);

    if (error || !data.user) {
      console.error("Supabase auth verification failed:", error);
      res.status(401).json({
        error: "Invalid or expired token. Please sign in again.",
      });
      return;
    }

    req.user = data.user;
    req.accessToken = token;
    next();
  } catch (error) {
    next(error);
  }
}
