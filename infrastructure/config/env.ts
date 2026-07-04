import { z } from "zod";

const supabaseEnvSchema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  SUPABASE_SECRET_KEY: z.string().min(1).optional(),
  SUPABASE_JWKS_URL: z.string().url().optional(),
});

const databaseEnvSchema = z.object({
  DATABASE_URL: z.string().min(1),
});

export type SupabaseEnvConfig = z.infer<typeof supabaseEnvSchema>;
export type DatabaseEnvConfig = z.infer<typeof databaseEnvSchema>;

let cachedSupabaseEnv: SupabaseEnvConfig | undefined;

function readSupabaseEnvInput(): Record<string, string | undefined> {
  const url =
    process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey =
    process.env.SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  return {
    SUPABASE_URL: url,
    SUPABASE_PUBLISHABLE_KEY: publishableKey,
    SUPABASE_SECRET_KEY:
      process.env.SUPABASE_SECRET_KEY ??
      process.env.SUPABASE_SERVICE_ROLE_KEY,
    SUPABASE_JWKS_URL: process.env.SUPABASE_JWKS_URL,
  };
}

function parseSupabaseEnv(): SupabaseEnvConfig | null {
  const result = supabaseEnvSchema.safeParse(readSupabaseEnvInput());

  if (!result.success) {
    return null;
  }

  return result.data;
}

export function tryGetSupabaseEnv(): SupabaseEnvConfig | null {
  if (cachedSupabaseEnv) {
    return cachedSupabaseEnv;
  }

  const parsed = parseSupabaseEnv();
  if (parsed) {
    cachedSupabaseEnv = parsed;
  }

  return parsed;
}

export function getSupabaseEnv(): SupabaseEnvConfig {
  const env = tryGetSupabaseEnv();

  if (!env) {
    const result = supabaseEnvSchema.safeParse(readSupabaseEnvInput());
    const missing = result.success
      ? "unknown"
      : result.error.issues.map((issue) => issue.path.join(".")).join(", ");
    throw new Error(`Missing or invalid Supabase environment variables: ${missing}`);
  }

  return env;
}

export function getDatabaseEnv(): DatabaseEnvConfig {
  const result = databaseEnvSchema.safeParse({
    DATABASE_URL: process.env.DATABASE_URL,
  });

  if (!result.success) {
    throw new Error(
      "Missing or invalid DATABASE_URL — set it in .env.local from Supabase → Settings → Database.",
    );
  }

  const supabaseHost = readSupabaseEnvInput().SUPABASE_URL;
  if (supabaseHost) {
    try {
      const databaseHost = new URL(result.data.DATABASE_URL).hostname;
      const usesSupabaseAuth = new URL(supabaseHost).hostname.endsWith(
        ".supabase.co",
      );
      const usesLocalDatabase =
        databaseHost === "localhost" || databaseHost === "127.0.0.1";

      if (usesSupabaseAuth && usesLocalDatabase) {
        throw new Error(
          "DATABASE_URL points to localhost but Supabase Auth is configured. Use the Supabase PostgreSQL connection string from Settings → Database in .env.local, then restart the dev server. If your shell exports DATABASE_URL, unset it first.",
        );
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes("DATABASE_URL points")) {
        throw error;
      }
    }
  }

  return result.data;
}

const openAiEnvSchema = z.object({
  OPENAI_API_KEY: z.string().min(1),
});

export type OpenAiEnvConfig = z.infer<typeof openAiEnvSchema>;

let cachedOpenAiEnv: OpenAiEnvConfig | undefined;

export function getOpenAiEnv(): OpenAiEnvConfig {
  if (cachedOpenAiEnv) {
    return cachedOpenAiEnv;
  }

  const result = openAiEnvSchema.safeParse({
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  });

  if (!result.success) {
    throw new Error(
      "Missing OPENAI_API_KEY — set it in .env.local to run AI categorization.",
    );
  }

  cachedOpenAiEnv = result.data;
  return cachedOpenAiEnv;
}

export function isAuthSkipped(): boolean {
  return process.env.SKIP_AUTH === "true";
}

const abrdEnvSchema = z.object({
  ABRD_API_BASE_URL: z.string().url(),
  ABRD_API_TOKEN: z.string().min(1),
});

export type AbrdEnvConfig = z.infer<typeof abrdEnvSchema>;

let cachedAbrdEnv: AbrdEnvConfig | undefined;

export function getAbrdEnv(): AbrdEnvConfig {
  if (cachedAbrdEnv) {
    return cachedAbrdEnv;
  }

  const result = abrdEnvSchema.safeParse({
    ABRD_API_BASE_URL: process.env.ABRD_API_BASE_URL,
    ABRD_API_TOKEN: process.env.ABRD_API_TOKEN,
  });

  if (!result.success) {
    throw new Error(
      "ABRD API is not configured. Set ABRD_API_BASE_URL and ABRD_API_TOKEN in .env.local.",
    );
  }

  cachedAbrdEnv = result.data;
  return cachedAbrdEnv;
}

export function isAbrdConfigured(): boolean {
  return abrdEnvSchema.safeParse({
    ABRD_API_BASE_URL: process.env.ABRD_API_BASE_URL,
    ABRD_API_TOKEN: process.env.ABRD_API_TOKEN,
  }).success;
}

/** @deprecated Use getSupabaseEnv() or getDatabaseEnv() */
export function getEnv(): SupabaseEnvConfig & DatabaseEnvConfig {
  return { ...getSupabaseEnv(), ...getDatabaseEnv() };
}

export type Env = ReturnType<typeof getEnv>;
