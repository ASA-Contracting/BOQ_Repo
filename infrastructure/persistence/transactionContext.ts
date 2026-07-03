import { AsyncLocalStorage } from "node:async_hooks";

import type { Db, DbTransaction } from "@/infrastructure/persistence/db";
import { getDb } from "@/infrastructure/persistence/db";

const transactionStorage = new AsyncLocalStorage<DbTransaction>();

export function getDbOrTransaction(): Db | DbTransaction {
  return transactionStorage.getStore() ?? getDb();
}

export function runWithTransaction<T>(
  tx: DbTransaction,
  work: () => Promise<T>,
): Promise<T> {
  return Promise.resolve(transactionStorage.run(tx, work));
}

export function getActiveTransaction(): DbTransaction | undefined {
  return transactionStorage.getStore();
}
