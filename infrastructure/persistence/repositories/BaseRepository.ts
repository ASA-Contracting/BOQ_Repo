import { getDbOrTransaction } from "@/infrastructure/persistence/transactionContext";
import type { Db, DbTransaction } from "@/infrastructure/persistence/db";

export abstract class DrizzleRepository {
  protected get database(): Db | DbTransaction {
    return getDbOrTransaction();
  }
}
