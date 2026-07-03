import { asc, eq } from "drizzle-orm";

import { familyLevelTypes } from "@/drizzle/schema";
import type { FamilyLevelType } from "@/domain/family/FamilyLevelType";
import type { FamilyLevelTypeId } from "@/domain/family/ids";
import type { IFamilyLevelTypeRepository } from "@/domain/family/repositories/IFamilyLevelTypeRepository";
import { mapFamilyLevelTypeRowToDomain } from "@/infrastructure/persistence/family/familyRowMapper";
import { DrizzleRepository } from "@/infrastructure/persistence/repositories/BaseRepository";

export class DrizzleFamilyLevelTypeRepository
  extends DrizzleRepository
  implements IFamilyLevelTypeRepository
{
  async findAll(): Promise<FamilyLevelType[]> {
    const rows = await this.database
      .select()
      .from(familyLevelTypes)
      .orderBy(asc(familyLevelTypes.Name));

    return rows.map(mapFamilyLevelTypeRowToDomain);
  }

  async findById(id: FamilyLevelTypeId): Promise<FamilyLevelType | null> {
    const rows = await this.database
      .select()
      .from(familyLevelTypes)
      .where(eq(familyLevelTypes.Id, id))
      .limit(1);

    const row = rows[0];
    return row ? mapFamilyLevelTypeRowToDomain(row) : null;
  }
}
