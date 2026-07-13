import { and, desc, eq, sql } from "drizzle-orm";

import { buildMaterialClassificationTreeIndex } from "@/domain/classification/tree-index";
import type {
  PricingPivotDataset,
  PricingPivotRow,
} from "@/domain/reporting/PricingPivotRow";
import type { IPricingPivotRepository } from "@/domain/reporting/repositories/IPricingPivotRepository";
import {
  boqItemVersions,
  boqItems,
  boqVersions,
  boqs,
  families,
  projects,
} from "@/drizzle/schema";
import { materialNodes } from "@/drizzle/schema/classification";
import { boqWorkBatch, boqWorkItem } from "@/drizzle/schema/workshop";
import { formatCategoryParentChildLabel } from "@/lib/category-picker-options";
import { loadMaterialNodesForTreeIndex } from "@/infrastructure/persistence/classification/loadMaterialNodesForTreeIndex";
import { DrizzleRepository } from "@/infrastructure/persistence/repositories/BaseRepository";
import { timedDbQuery } from "@/lib/performance/timed";

function parseNumeric(value: string | number | null | undefined): number | null {
  if (value == null || value === "") return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const parsed = Number(String(value).replace(/,/g, "").trim());
  return Number.isFinite(parsed) ? parsed : null;
}

function textOrFallback(value: string | null | undefined, fallback: string): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : fallback;
}

const ROW_CACHE_TTL_MS = 120_000;
let cachedDataset: PricingPivotDataset | null = null;
let cachedAt = 0;

export class DrizzlePricingPivotRepository
  extends DrizzleRepository
  implements IPricingPivotRepository
{
  async listPricingPivotRows(): Promise<PricingPivotDataset> {
    if (cachedDataset && Date.now() - cachedAt < ROW_CACHE_TTL_MS) {
      return cachedDataset;
    }

    const dataset = await timedDbQuery("listPricingPivotRows", () =>
      this.loadPricingPivotRows(),
    );
    cachedDataset = dataset;
    cachedAt = Date.now();
    return dataset;
  }

  private async loadPricingPivotRows(): Promise<PricingPivotDataset> {
    const db = this.database;

    const latestVersions = db
      .selectDistinctOn([boqVersions.BoqId], {
        id: boqVersions.Id,
        boqId: boqVersions.BoqId,
        discipline: boqVersions.Discipline,
        versionName: boqVersions.VersionName,
      })
      .from(boqVersions)
      .where(eq(boqVersions.IsDeleted, false))
      .orderBy(boqVersions.BoqId, desc(boqVersions.CreatedAt), desc(boqVersions.Id))
      .as("latest_versions");

    const disciplineExpr = sql<string | null>`coalesce(
      ${latestVersions.discipline},
      (
        select ${boqWorkItem.context_snapshot_json}::json->>'discipline'
        from ${boqWorkItem}
        inner join ${boqWorkBatch} on ${boqWorkBatch.id} = ${boqWorkItem.batch_id}
        where ${boqWorkBatch.linkedBoqVersionId} = ${latestVersions.id}
        limit 1
      )
    )`;

    const rows = await db
      .select({
        projectName: projects.Name,
        country: projects.Country,
        client: projects.Client,
        tenderStatus: projects.TenderStatus,
        boqName: boqs.Name,
        discipline: disciplineExpr,
        versionName: latestVersions.versionName,
        materialNodeId: boqItems.MaterialNodeId,
        materialNodeName: materialNodes.name,
        familyName: families.Name,
        unit: boqItems.Unit,
        quantity: boqItemVersions.Quantity,
        unitRate: boqItemVersions.UnitRate,
        totalSale: boqItemVersions.TotalSale,
        description: boqItems.Description,
      })
      .from(boqItems)
      .innerJoin(boqs, eq(boqItems.BoqId, boqs.Id))
      .innerJoin(projects, eq(boqs.ProjectId, projects.Id))
      .innerJoin(latestVersions, eq(latestVersions.boqId, boqs.Id))
      .innerJoin(
        boqItemVersions,
        and(
          eq(boqItemVersions.BoqItemId, boqItems.Id),
          eq(boqItemVersions.BoqVersionId, latestVersions.id),
          eq(boqItemVersions.IsDeleted, false),
        ),
      )
      .leftJoin(materialNodes, eq(boqItems.MaterialNodeId, materialNodes.id))
      .leftJoin(families, eq(boqItems.FamilyId, families.Id))
      .where(
        and(
          eq(boqItems.IsDeleted, false),
          eq(boqs.IsDeleted, false),
          eq(projects.IsDeleted, false),
          eq(boqItems.IsHeader, false),
          eq(boqItems.IsMeasurable, true),
        ),
      )
      .orderBy(projects.Name, boqs.Name, boqItems.RowIndex, boqItems.Id);

    const nodeIds = [
      ...new Set(
        rows
          .map((row) => row.materialNodeId)
          .filter((id): id is number => id != null),
      ),
    ];

    const pathByNodeId = new Map<number, string>();
    const parentLabelByNodeId = new Map<number, string | null>();

    if (nodeIds.length > 0) {
      const nodes = await loadMaterialNodesForTreeIndex(db, nodeIds);

      const treeIndex = buildMaterialClassificationTreeIndex(
        nodes.map((node) => ({
          id: node.id,
          name: node.name,
          parentId: node.parentId,
          schemaId: node.schemaId,
          materialLevelTypeId: node.levelTypeId,
          isActive: node.isActive,
        })),
      );

      for (const nodeId of nodeIds) {
        pathByNodeId.set(nodeId, treeIndex.pathLabelById.get(nodeId) ?? "");
        const path = treeIndex.pathById.get(nodeId) ?? [];
        const parent = path.length >= 2 ? path[path.length - 2] : null;
        parentLabelByNodeId.set(nodeId, parent?.name ?? null);
      }
    }

    const pivotRows: PricingPivotRow[] = rows.map((row) => {
      const categorized = row.materialNodeId != null;
      const categoryPath = categorized
        ? pathByNodeId.get(row.materialNodeId!) ??
          textOrFallback(row.materialNodeName, "Unknown category")
        : "Uncategorized";
      const categoryLabel =
        categorized && row.materialNodeName
          ? formatCategoryParentChildLabel(
              row.materialNodeName,
              parentLabelByNodeId.get(row.materialNodeId!) ?? null,
            )
          : "Uncategorized";

      return {
        projectName: textOrFallback(row.projectName, "Unknown project"),
        country: textOrFallback(row.country, "Unknown"),
        client: textOrFallback(row.client, "Unknown"),
        tenderStatus: textOrFallback(row.tenderStatus, "Unknown"),
        boqName: textOrFallback(row.boqName, "Unknown BOQ"),
        discipline: textOrFallback(row.discipline, "—"),
        versionName: textOrFallback(row.versionName, "—"),
        categoryPath,
        categoryLabel,
        familyName: textOrFallback(row.familyName, "Unassigned"),
        classificationStatus: categorized ? "Categorized" : "Uncategorized",
        unit: textOrFallback(row.unit, "—"),
        quantity: parseNumeric(row.quantity),
        unitRate: parseNumeric(row.unitRate),
        totalSale: parseNumeric(row.totalSale),
        description: textOrFallback(row.description, ""),
      };
    });

    return {
      rows: pivotRows,
      rowCount: pivotRows.length,
    };
  }
}
