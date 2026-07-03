import { and, asc, eq, ilike, isNull, ne, or, sql } from "drizzle-orm";

import { families } from "@/drizzle/schema";
import type { Family, NewFamily } from "@/domain/family/Family";
import type { FamilyReferenceCounts } from "@/domain/family/FamilyReferenceCounts";
import { toFamilyId, type FamilyId } from "@/domain/family/ids";
import type { IFamilyRepository } from "@/domain/family/repositories/IFamilyRepository";
import {
  mapFamilyRowToDomain,
  mapFamilyToUpdateRow,
  mapNewFamilyToInsertRow,
} from "@/infrastructure/persistence/family/familyRowMapper";
import { DrizzleRepository } from "@/infrastructure/persistence/repositories/BaseRepository";

type ReferenceCountRow = {
  child_count: number;
  boq_item_count: number;
  workshop_item_original_count: number;
  workshop_item_latest_suggested_count: number;
  workshop_item_final_count: number;
  workshop_item_production_check_count: number;
  workshop_ai_suggestion_count: number;
  workshop_review_previous_count: number;
  workshop_review_selected_count: number;
  workshop_export_old_count: number;
  workshop_export_new_count: number;
};

export class DrizzleFamilyRepository
  extends DrizzleRepository
  implements IFamilyRepository
{
  async findById(id: FamilyId): Promise<Family | null> {
    const rows = await this.database
      .select()
      .from(families)
      .where(eq(families.Id, id))
      .limit(1);

    const row = rows[0];
    return row ? mapFamilyRowToDomain(row) : null;
  }

  async findAllFlat(): Promise<Family[]> {
    const rows = await this.database
      .select()
      .from(families)
      .orderBy(asc(families.Name));

    return rows.map(mapFamilyRowToDomain);
  }

  async search(query: string, limit: number): Promise<Family[]> {
    const pattern = `%${query}%`;
    const rows = await this.database
      .select()
      .from(families)
      .where(
        or(
          ilike(families.Name, pattern),
          ilike(families.ReferenceCode, pattern),
          ilike(families.Description, pattern),
        ),
      )
      .orderBy(asc(families.Name))
      .limit(limit);

    return rows.map(mapFamilyRowToDomain);
  }

  async findChildren(parentId: FamilyId | null): Promise<Family[]> {
    const rows = await this.database
      .select()
      .from(families)
      .where(
        parentId === null
          ? isNull(families.ParentId)
          : eq(families.ParentId, parentId),
      )
      .orderBy(asc(families.Name));

    return rows.map(mapFamilyRowToDomain);
  }

  async findSiblingNames(
    parentId: FamilyId | null,
    excludeId?: FamilyId,
  ): Promise<string[]> {
    const parentCondition =
      parentId === null
        ? isNull(families.ParentId)
        : eq(families.ParentId, parentId);

    const rows = await this.database
      .select({ name: families.Name })
      .from(families)
      .where(
        excludeId === undefined
          ? parentCondition
          : and(parentCondition, ne(families.Id, excludeId)),
      );

    return rows.map((row) => row.name);
  }

  async getAncestorIds(familyId: FamilyId): Promise<FamilyId[]> {
    const result = await this.database.execute<{ ancestor_id: number }>(sql`
      WITH RECURSIVE ancestors AS (
        SELECT "ParentId" AS ancestor_id
        FROM "Families"
        WHERE "Id" = ${familyId}
        UNION ALL
        SELECT f."ParentId" AS ancestor_id
        FROM "Families" f
        INNER JOIN ancestors a ON f."Id" = a.ancestor_id
        WHERE f."ParentId" IS NOT NULL
      )
      SELECT ancestor_id
      FROM ancestors
      WHERE ancestor_id IS NOT NULL
    `);

    return result.map((row) => toFamilyId(row.ancestor_id));
  }

  async getReferenceCounts(familyId: FamilyId): Promise<FamilyReferenceCounts> {
    const result = await this.database.execute<ReferenceCountRow>(sql`
      SELECT
        (SELECT COUNT(*)::int FROM "Families" WHERE "ParentId" = ${familyId}) AS child_count,
        (SELECT COUNT(*)::int FROM "BoqItems" WHERE "FamilyId" = ${familyId}) AS boq_item_count,
        (SELECT COUNT(*)::int FROM "boq_work_item" WHERE "original_family_id" = ${familyId}) AS workshop_item_original_count,
        (SELECT COUNT(*)::int FROM "boq_work_item" WHERE "latest_suggested_family_id" = ${familyId}) AS workshop_item_latest_suggested_count,
        (SELECT COUNT(*)::int FROM "boq_work_item" WHERE "final_family_id" = ${familyId}) AS workshop_item_final_count,
        (SELECT COUNT(*)::int FROM "boq_work_item" WHERE "production_family_id_at_publish_check" = ${familyId}) AS workshop_item_production_check_count,
        (SELECT COUNT(*)::int FROM "boq_work_ai_suggestion" WHERE "suggested_family_id" = ${familyId}) AS workshop_ai_suggestion_count,
        (SELECT COUNT(*)::int FROM "boq_work_review_action" WHERE "previous_family_id" = ${familyId}) AS workshop_review_previous_count,
        (SELECT COUNT(*)::int FROM "boq_work_review_action" WHERE "selected_family_id" = ${familyId}) AS workshop_review_selected_count,
        (SELECT COUNT(*)::int FROM "boq_work_export_item" WHERE "old_family_id" = ${familyId}) AS workshop_export_old_count,
        (SELECT COUNT(*)::int FROM "boq_work_export_item" WHERE "new_family_id" = ${familyId}) AS workshop_export_new_count
    `);

    const row = result[0];

    return {
      childCount: row?.child_count ?? 0,
      boqItemCount: row?.boq_item_count ?? 0,
      workshopItemOriginalCount: row?.workshop_item_original_count ?? 0,
      workshopItemLatestSuggestedCount:
        row?.workshop_item_latest_suggested_count ?? 0,
      workshopItemFinalCount: row?.workshop_item_final_count ?? 0,
      workshopItemProductionCheckCount:
        row?.workshop_item_production_check_count ?? 0,
      workshopAiSuggestionCount: row?.workshop_ai_suggestion_count ?? 0,
      workshopReviewPreviousCount: row?.workshop_review_previous_count ?? 0,
      workshopReviewSelectedCount: row?.workshop_review_selected_count ?? 0,
      workshopExportOldCount: row?.workshop_export_old_count ?? 0,
      workshopExportNewCount: row?.workshop_export_new_count ?? 0,
    };
  }

  async create(family: NewFamily): Promise<Family> {
    const rows = await this.database
      .insert(families)
      .values(mapNewFamilyToInsertRow(family))
      .returning();

    const row = rows[0];
    if (!row) {
      throw new Error("Family insert did not return a row.");
    }

    return mapFamilyRowToDomain(row);
  }

  async update(family: Family): Promise<Family> {
    const rows = await this.database
      .update(families)
      .set(mapFamilyToUpdateRow(family))
      .where(eq(families.Id, family.id))
      .returning();

    const row = rows[0];
    if (!row) {
      throw new Error(`Family update did not return a row for id ${family.id}.`);
    }

    return mapFamilyRowToDomain(row);
  }

  async delete(id: FamilyId): Promise<void> {
    await this.database.delete(families).where(eq(families.Id, id));
  }
}
