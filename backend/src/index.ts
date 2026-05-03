import cors from "cors";
import express, {
  type ErrorRequestHandler,
  type NextFunction,
  type Request,
  type Response,
} from "express";
import helmet from "helmet";
import { ZodError } from "zod";
import aiRouter from "./routes/ai";
import jobsRouter from "./routes/jobs";
import profileRouter from "./routes/profile";
import resumesRouter from "./routes/resumes";
import generateResumeRouter from "./routes/generateResume";
import { ConfigError } from "./services/env";

const app = express();
const port = Number(process.env.PORT ?? 4000);
const frontendUrl = process.env.FRONTEND_URL ?? "http://localhost:8080";

app.use(helmet());
app.use(cors({ origin: frontendUrl }));
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok" });
});

app.use("/api", aiRouter);
app.use("/api", jobsRouter);
app.use("/api", profileRouter);
app.use("/api", resumesRouter);
app.use("/api", generateResumeRouter);

app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: "Route not found" });
});

const errorHandler: ErrorRequestHandler = (
  error: Error & { status?: number; statusCode?: number; code?: string },
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  console.error(error);

  if (error instanceof ZodError) {
    res.status(400).json({
      error: "Invalid request",
      details: error.flatten(),
    });
    return;
  }

  if (error instanceof ConfigError) {
    res.status(error.status).json({ error: error.message });
    return;
  }

  const status = error.status ?? error.statusCode ?? 500;
  const safeStatus = status >= 400 && status < 600 ? status : 500;
  const message =
    safeStatus === 500 ? "Internal server error" : error.message;

  res.status(safeStatus).json({ error: message });
};

app.use(errorHandler);

app.listen(port, () => {
  console.log(`AI Career Compass API listening on port ${port}`);
});

export default app;
