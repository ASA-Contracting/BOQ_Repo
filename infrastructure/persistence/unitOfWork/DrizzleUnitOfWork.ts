import type { IUnitOfWork } from "@/domain/shared/persistence/IUnitOfWork";
import { getDb } from "@/infrastructure/persistence/db";
import { runWithTransaction } from "@/infrastructure/persistence/transactionContext";

export class DrizzleUnitOfWork implements IUnitOfWork {
  async runInTransaction<T>(work: () => Promise<T>): Promise<T> {
    const db = getDb();
    return db.transaction(async (tx) => runWithTransaction(tx, work));
  }
}
