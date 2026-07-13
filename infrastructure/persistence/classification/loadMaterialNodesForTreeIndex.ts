import { sql } from "drizzle-orm";

import type { Db } from "@/infrastructure/persistence/db";

export type MaterialNodeTreeRow = {
  id: number;
  name: string;
  parentId: number | null;
  schemaId: number;
  levelTypeId: number | null;
  isActive: boolean;
};

/**
 * Loads seed nodes and their ancestor chain in one recursive query.
 */
export async function loadMaterialNodesForTreeIndex(
  db: Db,
  seedNodeIds: number[],
): Promise<MaterialNodeTreeRow[]> {
  const uniqueSeeds = [...new Set(seedNodeIds.filter((id) => Number.isFinite(id)))];
  if (uniqueSeeds.length === 0) {
    return [];
  }

  const result = await db.execute<MaterialNodeTreeRow>(sql`
    WITH RECURSIVE ancestors AS (
      SELECT
        id,
        name,
        parent_id AS "parentId",
        schema_id AS "schemaId",
        level_type_id AS "levelTypeId",
        is_active AS "isActive"
      FROM material_nodes
      WHERE id IN (${sql.join(uniqueSeeds.map((id) => sql`${id}`), sql`, `)})
        AND is_active = true
      UNION
      SELECT
        m.id,
        m.name,
        m.parent_id,
        m.schema_id,
        m.level_type_id,
        m.is_active
      FROM material_nodes m
      INNER JOIN ancestors a ON m.id = a."parentId"
      WHERE m.is_active = true
    )
    SELECT DISTINCT
      id,
      name,
      "parentId",
      "schemaId",
      "levelTypeId",
      "isActive"
    FROM ancestors
  `);

  return result as unknown as MaterialNodeTreeRow[];
}
