import { describe, expect, it } from "vitest";

import {
  getAppDatabaseUrl,
  isSupabaseSessionPooler,
} from "@/infrastructure/config/databaseUrl";

describe("getAppDatabaseUrl", () => {
  it("rewrites Supabase session pooler port to transaction pooler", () => {
    const input =
      "postgresql://postgres.project:secret@aws-0-eu-west-1.pooler.supabase.com:5432/postgres";
    const output = getAppDatabaseUrl(input);

    expect(output).toContain(":6543/");
    expect(output).not.toContain(":5432/");
  });

  it("leaves transaction pooler URLs unchanged", () => {
    const input =
      "postgresql://postgres.project:secret@aws-0-eu-west-1.pooler.supabase.com:6543/postgres";

    expect(getAppDatabaseUrl(input)).toBe(input);
  });

  it("leaves direct database URLs unchanged", () => {
    const input = "postgresql://postgres:secret@db.project.supabase.co:5432/postgres";

    expect(getAppDatabaseUrl(input)).toBe(input);
  });
});

describe("isSupabaseSessionPooler", () => {
  it("detects session pooler URLs", () => {
    expect(
      isSupabaseSessionPooler(
        "postgresql://u:p@aws-0-eu-west-1.pooler.supabase.com:5432/postgres",
      ),
    ).toBe(true);
  });

  it("returns false for transaction pooler URLs", () => {
    expect(
      isSupabaseSessionPooler(
        "postgresql://u:p@aws-0-eu-west-1.pooler.supabase.com:6543/postgres",
      ),
    ).toBe(false);
  });
});
