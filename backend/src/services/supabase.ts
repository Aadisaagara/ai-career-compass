import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../types";
import { getOptionalEnv, getRequiredEnv } from "./env";

let publicClient: SupabaseClient<Database> | null = null;
let adminClient: SupabaseClient<Database> | null = null;

function getSupabaseUrl(): string {
  return process.env.SUPABASE_URL ?? getRequiredEnv("VITE_SUPABASE_URL");
}

function getSupabasePublishableKey(): string {
  return (
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
    process.env.SUPABASE_PUBLISHABLE_KEY ??
    getRequiredEnv("VITE_SUPABASE_PUBLISHABLE_KEY")
  );
}

function getProjectRefFromUrl(supabaseUrl: string): string | null {
  try {
    return new URL(supabaseUrl).hostname.split(".")[0] ?? null;
  } catch {
    return null;
  }
}

function decodeJwtPayload(token: string): { ref?: string; role?: string } | null {
  try {
    const payload = token.split(".")[1];

    if (!payload) {
      return null;
    }

    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      ref?: string;
      role?: string;
    };
  } catch {
    return null;
  }
}

function createSupabaseClient(
  key: string,
  accessToken?: string,
): SupabaseClient<Database> {
  const headers = accessToken
    ? { Authorization: `Bearer ${accessToken}` }
    : undefined;

  return createClient<Database>(getSupabaseUrl(), key, {
    global: {
      headers,
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function createSupabaseAdminClient(): SupabaseClient<Database> | null {
  const supabaseServiceRoleKey = getOptionalEnv("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseServiceRoleKey) {
    return null;
  }

  const supabaseUrl = getSupabaseUrl();
  const keyPayload = decodeJwtPayload(supabaseServiceRoleKey);
  const urlProjectRef = getProjectRefFromUrl(supabaseUrl);

  if (
    keyPayload?.ref &&
    urlProjectRef &&
    keyPayload.ref !== urlProjectRef
  ) {
    console.warn(
      "SUPABASE_SERVICE_ROLE_KEY project ref does not match SUPABASE_URL; using user-scoped Supabase client instead.",
    );
    return null;
  }

  if (keyPayload?.role && keyPayload.role !== "service_role") {
    console.warn(
      "SUPABASE_SERVICE_ROLE_KEY is not a service_role key; using user-scoped Supabase client instead.",
    );
    return null;
  }

  return createSupabaseClient(supabaseServiceRoleKey);
}

export function getSupabase(accessToken?: string): SupabaseClient<Database> {
  adminClient ??= createSupabaseAdminClient();

  if (adminClient) {
    return adminClient;
  }

  if (accessToken) {
    return createSupabaseClient(getSupabasePublishableKey(), accessToken);
  }

  const supabaseUrl =
    process.env.SUPABASE_URL ?? getRequiredEnv("VITE_SUPABASE_URL");
  const supabasePublishableKey = getSupabasePublishableKey();

  publicClient ??= createClient<Database>(supabaseUrl, supabasePublishableKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return publicClient;
}

export const supabaseAdmin = getSupabase();
