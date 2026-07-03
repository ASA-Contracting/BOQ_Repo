/**
 * App runtime connection string. Migrations use raw DATABASE_URL from env.
 *
 * Supabase Session pooler (:5432) caps concurrent clients (~15). Next.js dev
 * opens many connections — use Transaction pooler (:6543) for the app.
 */
export function getAppDatabaseUrl(databaseUrl: string): string {
  let parsed: URL;

  try {
    parsed = new URL(databaseUrl);
  } catch {
    return databaseUrl;
  }

  const isSupabasePooler = parsed.hostname.endsWith(".pooler.supabase.com");
  const port = parsed.port || "5432";

  if (isSupabasePooler && port === "5432") {
    parsed.port = "6543";
    return parsed.toString();
  }

  return databaseUrl;
}

export function isSupabaseSessionPooler(databaseUrl: string): boolean {
  try {
    const parsed = new URL(databaseUrl);
    return (
      parsed.hostname.endsWith(".pooler.supabase.com") &&
      (parsed.port || "5432") === "5432"
    );
  } catch {
    return false;
  }
}
