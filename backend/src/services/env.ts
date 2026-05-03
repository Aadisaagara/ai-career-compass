import dotenv from "dotenv";
import path from "node:path";

const envFiles = [
  path.resolve(process.cwd(), ".env"),
  path.resolve(process.cwd(), "..", ".env"),
];

for (const envFile of envFiles) {
  dotenv.config({ path: envFile, override: false });
}

export class ConfigError extends Error {
  status = 503;

  constructor(message: string) {
    super(message);
  }
}

export function getRequiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new ConfigError(`${name} is required`);
  }

  if (value.startsWith("your-")) {
    throw new ConfigError(`${name} must be set to a real secret value`);
  }

  return value;
}

export function getOptionalEnv(name: string): string | undefined {
  const value = process.env[name];

  if (!value || value.startsWith("your-")) {
    return undefined;
  }

  return value;
}
