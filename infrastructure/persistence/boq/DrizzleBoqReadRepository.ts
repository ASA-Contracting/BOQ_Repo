import { and, desc, eq, sql } from 'drizzle-orm';

import type { BoqBreakdownDto, BoqListEntryDto, BoqWorkflowStatus } from '@/application/boq/dto';

import { aspNetUsers, boqItemVersions, boqItems, boqVersions, boqs, projects } from '@/drizzle/schema';
import { boqWorkBatch } from '@/drizzle/schema/workshop';

import { materialNodes } from '@/drizzle/schema/classification';

import type { IBoqReadRepository } from '@/domain/boq/repositories/IBoqReadRepository';

import { buildMaterialClassificationTreeIndex } from '@/domain/classification/tree-index';

import { DrizzleRepository } from '@/infrastructure/persistence/repositories/BaseRepository';



function resolveWorkflowStatus(

  measurableCount: number,

  pendingCount: number,

): BoqWorkflowStatus {

  if (measurableCount === 0) {

    return 'empty';

  }

  if (pendingCount === 0) {

    return 'complete';

  }

  return 'in_progress';

}



function toIsoString(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

export class DrizzleBoqReadRepository extends DrizzleRepository implements IBoqReadRepository {

  async listBoqs(): Promise<BoqListEntryDto[]> {
    const rows = await this.database
      .select({
        versionId: boqVersions.Id,
        boqId: boqs.Id,
        batchId: boqWorkBatch.id,
        name: boqs.Name,
        projectId: boqs.ProjectId,
        projectName: projects.Name,
        abrdProjectId: projects.AbdrProjectId,
        externalSource: projects.ExternalSource,
        client: projects.Client,
        versionName: boqVersions.VersionName,
        versionNumber: boqVersions.VersionNumber,
        approvalStatus: boqVersions.ApprovalStatus,
        workflowStage: boqWorkBatch.workflowStage,
        createdBy: boqVersions.CreatedBy,
        importedByName: aspNetUsers.FullName,
        importedAt: boqVersions.CreatedAt,
        itemCount: sql<number>`(
          select count(*)::int
          from ${boqItems}
          where ${boqItems.BoqId} = ${boqs.Id}
            and ${boqItems.IsDeleted} = false
        )`,
        measurableCount: sql<number>`(
          select count(*)::int
          from ${boqItems}
          where ${boqItems.BoqId} = ${boqs.Id}
            and ${boqItems.IsDeleted} = false
            and ${boqItems.IsMeasurable} = true
            and ${boqItems.IsHeader} = false
        )`,
        categorizedCount: sql<number>`(
          select count(*)::int
          from ${boqItems}
          where ${boqItems.BoqId} = ${boqs.Id}
            and ${boqItems.IsDeleted} = false
            and ${boqItems.IsMeasurable} = true
            and ${boqItems.IsHeader} = false
            and ${boqItems.MaterialNodeId} is not null
        )`,
        updatedAt: sql<Date | string | null>`(
          select max(${boqItems.UpdatedAt})
          from ${boqItems}
          where ${boqItems.BoqId} = ${boqs.Id}
            and ${boqItems.IsDeleted} = false
        )`,
      })
      .from(boqVersions)
      .innerJoin(boqs, eq(boqVersions.BoqId, boqs.Id))
      .innerJoin(projects, eq(boqs.ProjectId, projects.Id))
      .leftJoin(boqWorkBatch, eq(boqWorkBatch.linkedBoqVersionId, boqVersions.Id))
      .leftJoin(aspNetUsers, eq(boqVersions.CreatedBy, aspNetUsers.Id))
      .where(
        and(
          eq(boqVersions.IsDeleted, false),
          eq(boqs.IsDeleted, false),
          eq(projects.IsDeleted, false),
        ),
      )
      .orderBy(desc(boqVersions.CreatedAt), desc(boqVersions.Id));

    return rows.map((row) => {
      const measurableCount = row.measurableCount ?? 0;
      const categorizedCount = row.categorizedCount ?? 0;
      const pendingCount = Math.max(0, measurableCount - categorizedCount);

      return {
        id: row.versionId,
        boqId: row.boqId,
        batchId: row.batchId ?? null,
        name: row.name,
        projectId: row.projectId,
        projectName: row.projectName,
        abrdProjectId: row.abrdProjectId ?? null,
        externalSource: row.externalSource ?? "local",
        client: row.client ?? null,
        versionId: row.versionId,
        versionName: row.versionName,
        versionNumber: row.versionNumber,
        approvalStatus: row.approvalStatus,
        workflowStage: row.workflowStage ?? null,
        itemCount: row.itemCount ?? 0,
        measurableCount,
        categorizedCount,
        pendingCount,
        status: resolveWorkflowStatus(measurableCount, pendingCount),
        importedAt: toIsoString(row.importedAt),
        importedById: row.createdBy ?? null,
        importedByName: row.importedByName ?? null,
        updatedAt: toIsoString(row.updatedAt),
      };
    });
  }



  async getBoqBreakdown(boqId: number): Promise<BoqBreakdownDto | null> {

    const boqRows = await this.database

      .select({

        id: boqs.Id,

        name: boqs.Name,

        projectId: boqs.ProjectId,

        projectName: projects.Name,

      })

      .from(boqs)

      .innerJoin(projects, eq(boqs.ProjectId, projects.Id))

      .where(and(eq(boqs.Id, boqId), eq(boqs.IsDeleted, false), eq(projects.IsDeleted, false)))

      .limit(1);



    const boq = boqRows[0];

    if (!boq) {

      return null;

    }



    const versionRows = await this.database

      .select({

        id: boqVersions.Id,

        versionName: boqVersions.VersionName,

      })

      .from(boqVersions)

      .where(and(eq(boqVersions.BoqId, boqId), eq(boqVersions.IsDeleted, false)))

      .orderBy(desc(boqVersions.CreatedAt))

      .limit(1);



    const version = versionRows[0] ?? null;



    const itemRows = await this.database

      .select({

        id: boqItems.Id,

        rowIndex: boqItems.RowIndex,

        itemNo: boqItems.ItemNo,

        description: boqItems.Description,

        unit: boqItems.Unit,

        isHeader: boqItems.IsHeader,

        isMeasurable: boqItems.IsMeasurable,

        materialNodeId: boqItems.MaterialNodeId,

        materialNodeName: materialNodes.name,

        quantity: boqItemVersions.Quantity,

        unitRate: boqItemVersions.UnitRate,

        totalSale: boqItemVersions.TotalSale,

      })

      .from(boqItems)

      .leftJoin(materialNodes, eq(boqItems.MaterialNodeId, materialNodes.id))

      .leftJoin(

        boqItemVersions,

        version

          ? and(

              eq(boqItemVersions.BoqItemId, boqItems.Id),

              eq(boqItemVersions.BoqVersionId, version.id),

              eq(boqItemVersions.IsDeleted, false),

            )

          : sql`false`,

      )

      .where(and(eq(boqItems.BoqId, boqId), eq(boqItems.IsDeleted, false)))

      .orderBy(boqItems.RowIndex, boqItems.Id);



    const nodeIds = itemRows

      .map((row) => row.materialNodeId)

      .filter((id): id is number => id != null);



    const pathByNodeId = new Map<number, string>();

    if (nodeIds.length > 0) {

      const nodes = await this.database

        .select({

          id: materialNodes.id,

          name: materialNodes.name,

          parentId: materialNodes.parentId,

          schemaId: materialNodes.schemaId,

          levelTypeId: materialNodes.levelTypeId,

          purpose: materialNodes.purpose,

          isActive: materialNodes.isActive,

        })

        .from(materialNodes)

        .where(eq(materialNodes.isActive, true));



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

        pathByNodeId.set(nodeId, treeIndex.pathLabelById.get(nodeId) ?? '');

      }

    }



    return {

      id: boq.id,

      name: boq.name,

      projectId: boq.projectId,

      projectName: boq.projectName,

      versionId: version?.id ?? null,

      versionName: version?.versionName ?? null,

      items: itemRows.map((row) => ({

        id: row.id,

        rowIndex: row.rowIndex,

        itemNo: row.itemNo,

        description: row.description,

        unit: row.unit,

        quantity: row.quantity,

        rate: row.unitRate,

        total: row.totalSale,

        isHeader: row.isHeader,

        isMeasurable: row.isMeasurable,

        materialNodeId: row.materialNodeId,

        categoryLabel: row.materialNodeName,

        categoryPath: row.materialNodeId ? pathByNodeId.get(row.materialNodeId) ?? row.materialNodeName : null,

      })),

    };

  }



  async updateItemMaterialNodeId(itemId: number, materialNodeId: number | null): Promise<void> {

    await this.database

      .update(boqItems)

      .set({

        MaterialNodeId: materialNodeId,

        UpdatedAt: new Date(),

      })

      .where(and(eq(boqItems.Id, itemId), eq(boqItems.IsDeleted, false)));

  }

}

