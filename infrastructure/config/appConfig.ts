import { z } from "zod";

import packageJson from "../../package.json";

const logLevelSchema = z.enum(["debug", "info", "warn", "error"]);

const appEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  LOG_LEVEL: logLevelSchema.default("info"),
  APP_VERSION: z.string().min(1).optional(),
});

export type AppConfig = {
  nodeEnv: "development" | "test" | "production";
  logLevel: z.infer<typeof logLevelSchema>;
  appVersion: string;
};

let cachedAppConfig: AppConfig | undefined;

export function getAppConfig(): AppConfig {
  if (cachedAppConfig) {
    return cachedAppConfig;
  }

  const result = appEnvSchema.safeParse({
    NODE_ENV: process.env.NODE_ENV,
    LOG_LEVEL: process.env.LOG_LEVEL,
    APP_VERSION: process.env.APP_VERSION,
  });

  if (!result.success) {
    throw new Error(
      `Invalid application configuration: ${result.error.issues
        .map((issue) => issue.path.join("."))
        .join(", ")}`,
    );
  }

  cachedAppConfig = {
    nodeEnv: result.data.NODE_ENV,
    logLevel: result.data.LOG_LEVEL,
    appVersion: result.data.APP_VERSION ?? packageJson.version,
  };

  return cachedAppConfig;
}

export function resetAppConfigCache(): void {
  cachedAppConfig = undefined;
}
