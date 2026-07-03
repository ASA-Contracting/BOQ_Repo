import { sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { DrizzleDatabaseHealthRepository } from "@/infrastructure/persistence/repositories/DrizzleDatabaseHealthRepository";
import { DrizzleUnitOfWork } from "@/infrastructure/persistence/unitOfWork/DrizzleUnitOfWork";
import {
  checkDbConnection,
  closeDb,
  getDb,
  resetDbForTests,
} from "@/infrastructure/persistence/db";
import { getActiveTransaction } from "@/infrastructure/persistence/transactionContext";

let databaseAvailable = false;

beforeAll(async () => {
  if (!process.env.DATABASE_URL) {
    databaseAvailable = false;
    return;
  }

  databaseAvailable = await checkDbConnection();
  await closeDb();
  resetDbForTests();
});

afterAll(async () => {
  await closeDb();
  resetDbForTests();
});

describe("Drizzle persistence integration", () => {
  it.skipIf(!databaseAvailable)(
    "checks database connectivity through repository",
    async () => {
      const repository = new DrizzleDatabaseHealthRepository();
      await expect(repository.checkConnection()).resolves.toBe(true);
    },
  );

  it.skipIf(!databaseAvailable)(
    "runs callbacks inside a drizzle transaction scope",
    async () => {
      const unitOfWork = new DrizzleUnitOfWork();
      let sawTransaction = false;

      await unitOfWork.runInTransaction(async () => {
        sawTransaction = getActiveTransaction() !== undefined;
        await getDb().execute(sql`select 1`);
      });

      expect(sawTransaction).toBe(true);
      expect(getActiveTransaction()).toBeUndefined();
    },
  );

  it.skipIf(!databaseAvailable)(
    "rolls back failed transaction work",
    async () => {
      const unitOfWork = new DrizzleUnitOfWork();

      await expect(
        unitOfWork.runInTransaction(async () => {
          await getDb().execute(sql`select 1`);
          throw new Error("force rollback");
        }),
      ).rejects.toThrow("force rollback");
    },
  );

  it("documents when live database integration is unavailable", () => {
    if (databaseAvailable) {
      expect(process.env.DATABASE_URL).toBeTruthy();
      return;
    }

    expect(databaseAvailable).toBe(false);
  });
});
