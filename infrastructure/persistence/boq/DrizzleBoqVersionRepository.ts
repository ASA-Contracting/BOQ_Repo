import { and, eq, sql } from "drizzle-orm";

import { boqItemVersions, boqVersions } from "@/drizzle/schema";
import type { BoqId, BoqVersionId } from "@/domain/boq/ids";
import type { IBoqVersionRepository } from "@/domain/boq/repositories/IBoqVersionRepository";
import type { BoqVersionApprovalStatus } from "@/domain/workshop/WorkshopWorkflowStage";
import { DrizzleRepository } from "@/infrastructure/persistence/repositories/BaseRepository";

export class DrizzleBoqVersionRepository
  extends DrizzleRepository
  implements IBoqVersionRepository
{
  async findById(versionId: BoqVersionId) {
    const rows = await this.database
      .select({
        id: boqVersions.Id,
        boqId: boqVersions.BoqId,
        versionNumber: boqVersions.VersionNumber,
        versionName: boqVersions.VersionName,
        approvalStatus: boqVersions.ApprovalStatus,
      })
      .from(boqVersions)
      .where(and(eq(boqVersions.Id, versionId), eq(boqVersions.IsDeleted, false)))
      .limit(1);

    return rows[0] ?? null;
  }

  async getNextVersionNumber(boqId: BoqId): Promise<number> {
    const rows = await this.database
      .select({
        maxNumber: sql<number>`coalesce(max(${boqVersions.VersionNumber}), 0)::int`,
      })
      .from(boqVersions)
      .where(
        and(
          eq(boqVersions.BoqId, boqId),
          eq(boqVersions.IsDeleted, false),
          eq(boqVersions.ApprovalStatus, "approved"),
        ),
      );

    return (rows[0]?.maxNumber ?? 0) + 1;
  }

  async updateApprovalStatus(
    versionId: BoqVersionId,
    input: {
      approvalStatus: BoqVersionApprovalStatus;
      versionName?: string;
      versionNumber?: number;
    },
  ): Promise<void> {
    await this.database
      .update(boqVersions)
      .set({
        ApprovalStatus: input.approvalStatus,
        ...(input.versionName !== undefined ? { VersionName: input.versionName } : {}),
        ...(input.versionNumber !== undefined ? { VersionNumber: input.versionNumber } : {}),
      })
      .where(eq(boqVersions.Id, versionId));
  }

  async duplicateAsDraft(input: {
    boqId: BoqId;
    sourceVersionId: BoqVersionId;
    createdBy: string;
  }): Promise<{ versionId: BoqVersionId }> {
    const now = new Date();

    return this.database.transaction(async (tx) => {
      const sourceRows = await tx
        .select({
          id: boqVersions.Id,
          discipline: boqVersions.Discipline,
        })
        .from(boqVersions)
        .where(
          and(
            eq(boqVersions.Id, input.sourceVersionId),
            eq(boqVersions.BoqId, input.boqId),
            eq(boqVersions.IsDeleted, false),
          ),
        )
        .limit(1);

      if (!sourceRows[0]) {
        throw new Error("Source BOQ version not found.");
      }

      const versionRows = await tx
        .insert(boqVersions)
        .values({
          BoqId: input.boqId,
          VersionName: "Draft",
          VersionNumber: null,
          ApprovalStatus: "draft",
          Discipline: sourceRows[0].discipline,
          Notes: `Duplicated from version ${input.sourceVersionId}`,
          Source: "duplicate",
          CreatedBy: input.createdBy,
          CreatedAt: now,
          IsDeleted: false,
        })
        .returning({ id: boqVersions.Id });

      const newVersionId = versionRows[0]?.id;
      if (!newVersionId) {
        throw new Error("Failed to create duplicated BOQ version.");
      }

      const sourceItemVersions = await tx
        .select({
          boqItemId: boqItemVersions.BoqItemId,
          quantity: boqItemVersions.Quantity,
          unitRate: boqItemVersions.UnitRate,
          totalSale: boqItemVersions.TotalSale,
        })
        .from(boqItemVersions)
        .where(
          and(
            eq(boqItemVersions.BoqVersionId, input.sourceVersionId),
            eq(boqItemVersions.IsDeleted, false),
          ),
        );

      if (sourceItemVersions.length > 0) {
        await tx.insert(boqItemVersions).values(
          sourceItemVersions.map((row) => ({
            BoqItemId: row.boqItemId,
            BoqVersionId: newVersionId,
            Quantity: row.quantity,
            UnitRate: row.unitRate,
            TotalSale: row.totalSale,
            CreatedBy: input.createdBy,
            CreatedAt: now,
            IsDeleted: false,
          })),
        );
      }

      return { versionId: newVersionId as BoqVersionId };
    });
  }
}
