import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "@/drizzle/schema";
import { getAppDatabaseUrl } from "@/infrastructure/config/databaseUrl";
import { getDatabaseEnv } from "@/infrastructure/config/env";

export type Db = PostgresJsDatabase<typeof schema>;
export type DbTransaction = Parameters<Parameters<Db["transaction"]>[0]>[0];

type DbCache = {
  url: string;
  client: ReturnType<typeof postgres>;
  db: Db;
};

const GLOBAL_DB_KEY = "__boqDbCache" as const;

type GlobalDb = typeof globalThis & {
  [GLOBAL_DB_KEY]?: DbCache;
};

function getGlobalDb(): GlobalDb {
  return globalThis as GlobalDb;
}

function createClient(databaseUrl: string): ReturnType<typeof postgres> {
  return postgres(databaseUrl, {
    prepare: false,
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
    max_lifetime: 60 * 30,
  });
}

function getDbCache(): DbCache {
  const globalDb = getGlobalDb();
  const databaseUrl = getAppDatabaseUrl(getDatabaseEnv().DATABASE_URL);
  const existing = globalDb[GLOBAL_DB_KEY];

  if (existing && existing.url === databaseUrl) {
    return existing;
  }

  if (existing) {
    void existing.client.end({ timeout: 5 });
  }

  const client = createClient(databaseUrl);
  const cache: DbCache = {
    url: databaseUrl,
    client,
    db: drizzle(client, { schema }),
  };

  globalDb[GLOBAL_DB_KEY] = cache;
  return cache;
}

export function resetDbAfterError(error: unknown): void {
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: string }).code === '57014'
  ) {
    resetDbForTests();
  }
}

export function getDb(): Db {
  return getDbCache().db;
}

export async function closeDb(): Promise<void> {
  const cache = getGlobalDb()[GLOBAL_DB_KEY];
  if (cache) {
    await cache.client.end({ timeout: 5 });
    getGlobalDb()[GLOBAL_DB_KEY] = undefined;
  }
}

export async function checkDbConnection(): Promise<boolean> {
  try {
    const database = getDb();
    await database.execute(sql`select 1`);
    return true;
  } catch {
    return false;
  }
}

export function resetDbForTests(): void {
  getGlobalDb()[GLOBAL_DB_KEY] = undefined;
}

export function getResolvedDatabasePort(): string | undefined {
  try {
    return new URL(getAppDatabaseUrl(getDatabaseEnv().DATABASE_URL)).port || "5432";
  } catch {
    return undefined;
  }
}
