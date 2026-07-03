import { sql } from "drizzle-orm";

import type { IDatabaseHealthRepository } from "@/domain/shared/persistence/IDatabaseHealthRepository";
import { DrizzleRepository } from "@/infrastructure/persistence/repositories/BaseRepository";

export class DrizzleDatabaseHealthRepository
  extends DrizzleRepository
  implements IDatabaseHealthRepository
{
  async checkConnection(): Promise<boolean> {
    try {
      await this.database.execute(sql`select 1`);
      return true;
    } catch {
      return false;
    }
  }
}
